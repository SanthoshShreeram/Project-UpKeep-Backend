const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const User = require("../models/User");
const EmergencyRequest = require("../models/EmergencyRequest");
const { verifyRole } = require("../middlewares/authMiddleware");
const haversine = require("haversine-distance");

// Function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Request Emergency Assistance
router.post("/create-request", verifyFirebaseToken, async (req, res) => {
  try {
    const { latitude, longitude, issueType, vehicle } = req.body;

    if (!latitude || !longitude || !issueType || !vehicle) {
      return res
        .status(400)
        .json({ message: "Location and issue type are required." });
    }

    // Create a new emergency request
    const emergencyRequest = new EmergencyRequest({
      service: "emergency-service",
      userId: req.user.uid,
      location: { latitude, longitude },
      issueType,
      vehicle: {
        name: vehicle.name,
        model: vehicle.model,
        fuelType: vehicle.fuelType,
        lastServiceDate: vehicle.lastServiceDate || "Not Available",
        vehicleType: vehicle.vehicleType,
      },
      status: "Pending",
    });

    await emergencyRequest.save();

    // Find nearby mechanics (for now, just all mechanics)
    const nearbyMechanics = await User.find({
      role: "Mechanic",
      suspended: false,
    });

    // Simulate sending notifications (log for now)
    console.log("Notifying nearby mechanics:", nearbyMechanics);

    res.json({
      message: "Emergency request created successfully.",
      requestId: emergencyRequest._id,
    });
  } catch (err) {
    console.error("Error handling emergency request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get assigned mechanic details and calculate distance/ETA
router.get(
  "/mechanic-details/:requestId",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const { requestId } = req.params;

      // Find the emergency request
      const emergencyRequest = await EmergencyRequest.findById(requestId);
      if (!emergencyRequest) {
        return res.status(404).json({ message: "Emergency request not found" });
      }

      if (!emergencyRequest.assignedMechanic) {
        return res.status(400).json({ message: "No mechanic assigned yet" });
      }

      // Find the mechanic
      const mechanic = await User.findOne({
        firebaseUID: emergencyRequest.assignedMechanic,
      });
      console.log(mechanic);
      if (!mechanic) {
        return res.status(404).json({ message: "Mechanic not found" });
      }

      // Calculate distance using haversine formula
      const userLocation = emergencyRequest.location;
      const mechanicLocation = mechanic.location;

      if (
        !mechanicLocation ||
        !mechanicLocation.latitude ||
        !mechanicLocation.longitude
      ) {
        return res
          .status(400)
          .json({ message: "Mechanic location not available" });
      }

      const distanceMeters = haversine(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        {
          latitude: mechanicLocation.latitude,
          longitude: mechanicLocation.longitude,
        }
      );

      const distanceKm = (distanceMeters / 1000).toFixed(2); // Convert meters to kilometers

      // Estimate ETA (assuming 40 km/h speed)
      const estimatedTimeMinutes = Math.ceil((distanceKm / 40) * 60);

      res.json({
        mechanic: {
          id: mechanic._id,
          name: mechanic.name,
          phone: mechanic.phoneNumber,
          rating: mechanic.rating || "Not Available",
          location: mechanic.location,
        },
        distance: `${distanceKm} km`,
        eta: `${estimatedTimeMinutes} min`,
      });
    } catch (err) {
      console.error("Error fetching mechanic details:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Get ongoing emergency booking for the user
router.get("/ongoing", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid; // Firebase UID from auth middleware
    const ongoingBooking = await EmergencyRequest.find({
      userId,
      status: { $in: ["Accepted"] }, // Adjust based on your statuses
    });

    if (!ongoingBooking) {
      return res.status(200).json({ booking: null }); // No ongoing booking found
    }

    res.json({ booking: ongoingBooking });
  } catch (error) {
    console.error("Error fetching emergency ongoing booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/history", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid; // Firebase UID from auth middleware
    const emergencyBookings = await EmergencyRequest.find({ userId });

    res.json({ bookings: emergencyBookings });
  } catch (error) {
    console.error("Error fetching emergency booking history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route for mechanics to view pending emergency requests
router.get(
  "/show-requests",
  verifyFirebaseToken,
  verifyRole("Mechanic"),
  async (req, res) => {
    try {
      const mechanicId = req.user.uid;

      // Fetch mechanic details from the database
      const mechanic = await User.findOne({
        firebaseUID: mechanicId,
        approved: true, // Ensure the mechanic is approved
        suspended: false, // Ensure the mechanic is not suspended
      });

      if (
        !mechanic ||
        !mechanic.location ||
        !mechanic.location.latitude ||
        !mechanic.location.longitude
      ) {
        return res
          .status(400)
          .json({ message: "Mechanic location not available" });
      }

      // Check if the mechanic is allowed to receive emergency requests
      if (mechanic.servicePreference === "Scheduled service only") {
        return res
          .status(403)
          .json({ message: "You have opted out of emergency services" });
      }
      const { latitude, longitude } = mechanic.location;

      // Find all pending requests that haven't been rejected by the mechanic
      let requests = await EmergencyRequest.find({
        status: "Pending",
        rejectedBy: { $nin: [mechanicId] },
      }).populate("userId");

      // Calculate the distance for each request
      requests = requests.map((request) => {
        const userLocation = request.location;
        const distance = calculateDistance(
          latitude,
          longitude,
          userLocation.latitude,
          userLocation.longitude
        );
        return { ...request.toObject(), distance: distance.toFixed(2) };
      });

      // Sort by distance (nearest requests first)
      requests.sort((a, b) => a.distance - b.distance);

      res.json(requests);
    } catch (err) {
      console.error("Error fetching requests:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Get emergency request status
router.get("/request-status/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the request in the database
    const request = await EmergencyRequest.findById(requestId).populate(
      "assignedMechanic"
    ); // Populate mechanic details

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Return request status and mechanic details if assigned
    res.json({
      status: request.status, // 'Pending', 'Accepted', etc.
      mechanic: request.assignedMechanic || null,
    });
  } catch (error) {
    console.error("Error fetching request status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route for a mechanic to accept an emergency request
router.patch(
  "/accept-request/:requestId",
  verifyFirebaseToken,
  verifyRole("Mechanic"),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const mechanicId = req.user.uid;
      console.log(mechanicId);
      // Find the emergency request
      const request = await EmergencyRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Ensure the request is still pending
      if (request.status !== "Pending") {
        return res
          .status(400)
          .json({ message: "Request is no longer available" });
      }

      // Update the request to "Accepted" and assign the mechanic
      request.status = "Accepted";
      request.assignedMechanic = mechanicId;
      await request.save();

      res.json({ message: "Request accepted successfully", request });
    } catch (err) {
      console.error("Error accepting request:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);
//reject request
router.patch(
  "/reject-request/:requestId",
  verifyFirebaseToken,
  verifyRole("Mechanic"),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const mechanicId = req.user.uid;

      const request = await EmergencyRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Ensure the mechanic has not already rejected this request
      if (request.rejectedBy.includes(mechanicId)) {
        return res.status(400).json({ message: "Request already rejected" });
      }

      // Add mechanic ID to rejectedBy list
      request.rejectedBy.push(mechanicId);
      await request.save();

      res.json({ message: "Request rejected successfully" });
    } catch (err) {
      console.error("Error rejecting request:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);
//cancel request
router.patch(
  "/cancel-request/:requestId",
  verifyFirebaseToken,
  verifyRole("Mechanic"),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const mechanicId = req.user.uid;

      // Find the emergency request
      const request = await EmergencyRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Ensure only the assigned mechanic can cancel it
      if (request.assignedMechanic !== mechanicId) {
        return res.status(403).json({ message: "Unauthorized action" });
      }

      // Ensure the request is still accepted
      if (request.status !== "Accepted") {
        return res
          .status(400)
          .json({ message: "Request cannot be cancelled at this stage" });
      }

      // Update the request to "Pending" and remove the assigned mechanic
      request.status = "Cancelled";
      request.assignedMechanic = null;
      request.rejectedBy.push(mechanicId); // Add mechanic to rejected list
      await request.save();

      res.json({ message: "Request cancelled successfully", request });
    } catch (err) {
      console.error("Error cancelling request:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);
//mark as completed
router.patch(
  "/complete-request/:requestId",
  verifyFirebaseToken,
  verifyRole("Mechanic"),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const mechanicId = req.user.uid;

      // Find the request
      const request = await EmergencyRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Ensure the request is accepted and assigned to the mechanic
      if (
        request.status !== "Accepted" ||
        request.assignedMechanic !== mechanicId
      ) {
        return res
          .status(400)
          .json({ message: "You cannot complete this request" });
      }

      // Mark as completed
      request.status = "Completed";
      await request.save();

      res.json({ message: "Service marked as completed", request });
    } catch (err) {
      console.error("Error marking request as completed:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);
//mechanic order history
router.get("/mechanic-history", verifyFirebaseToken, async (req, res) => {
  try {
    const mechanicId = req.user.uid; // Firebase UID of the logged-in mechanic

    const emergencyRequests = await EmergencyRequest.find({
      assignedMechanic: mechanicId,
    }).sort({ createdAt: -1 });

    res.json({ orders: emergencyRequests });
  } catch (error) {
    console.error("Error fetching mechanic's emergency history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to track a mechanic's location for an emergency request
router.get(
  "/track-request/:requestId",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const { requestId } = req.params;

      // Find the emergency request and populate mechanic details
      const request = await EmergencyRequest.findById(requestId).populate(
        "assignedMechanicId"
      );

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Ensure the request is accepted
      if (request.status !== "Accepted") {
        return res
          .status(400)
          .json({ message: "Request has not been accepted" });
      }

      // Simulate tracking (actual implementation depends on location sharing)
      const mechanicLocation = {
        latitude: "12.9716",
        longitude: "77.5946", // Placeholder coordinates
      };

      const estimatedArrivalTime = "15 minutes"; // Placeholder ETA

      res.json({ mechanicLocation, estimatedArrivalTime });
    } catch (err) {
      console.error("Error tracking mechanic:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

module.exports = router;
