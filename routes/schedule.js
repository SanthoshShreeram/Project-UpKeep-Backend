const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const ServiceBooking = require("../models/ScheduledService");
const User = require("../models/User");
const { verifyRole } = require("../middlewares/authMiddleware");

// Create Service Booking
router.post("/create", verifyFirebaseToken, async (req, res) => {
  try {
    const {
      serviceName,
      date,
      time,
      address,
      coordinates,
      vehicle,
      paymentId,
      amount,
    } = req.body;
    if (!date || !time || !address || !coordinates) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Find the nearest mechanic or pick a random one
    const nearbyMechanics = await User.find({
      role: "Mechanic",
      approved: true,
      suspended: false,
    });

    if (!nearbyMechanics || nearbyMechanics.length === 0) {
      return res.status(404).json({ message: "No mechanics available" });
    }
    // For simplicity, select a random mechanic for now (later, proximity-based logic can be added)
    const assignedMechanic =
      nearbyMechanics[Math.floor(Math.random() * nearbyMechanics.length)];
    // Create the service booking
    const newBooking = new ServiceBooking({
      service: "scheduled-service",
      userId: req.user.uid,
      mechanicId: assignedMechanic.firebaseUID,
      serviceName,
      date,
      time,
      address,
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
      vehicle: {
        name: vehicle.name,
        modelYear: vehicle.modelYear,
        fuelType: vehicle.fuelType,
        vehicleType: vehicle.vehicleType,
      },
      amount,
      paymentId,
    });
    await newBooking.save();
    res.status(201).json({
      message: "Service booking created successfully",
      booking: newBooking,
      assignedMechanic,
    });
  } catch (err) {
    console.error("Error creating service booking:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get ongoing scheduled booking for the user
router.get("/ongoing", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const ongoingBooking = await ServiceBooking.find({
      userId,
      status: { $in: ["Scheduled"] },
    });

    if (!ongoingBooking) {
      return res.status(200).json({ booking: null }); // No ongoing booking found
    }

    res.json({ booking: ongoingBooking });
  } catch (error) {
    console.error("Error fetching scheduled ongoing booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/history", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const scheduledBookings = await ServiceBooking.find({ userId });

    res.json({ bookings: scheduledBookings });
  } catch (error) {
    console.error("Error fetching scheduled booking history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//List User Bookings
router.get("/user-bookings", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid; // Use Firebase UID
    const bookings = await ServiceBooking.find({ userId }).populate(
      "mechanicId",
      "name email"
    );
    res.json({ bookings });
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//List Mechanic’s Appointments
router.get(
  "/mechanic-appointments",
  verifyFirebaseToken,
  verifyRole("Mechanic"),
  async (req, res) => {
    try {
      // Correctly fetch the mechanic's Firebase UID from the verified token
      const mechanicUID = req.user.uid; // Ensure you're using 'uid', not 'mechanicID'
      // console.log("Mechanic UID:", mechanicUID); // Log the mechanic UID for debugging

      // Find all service bookings where this mechanic is assigned
      const appointments = await ServiceBooking.find({
        mechanicId: mechanicUID,
      });
      res.json({ appointments });
    } catch (err) {
      console.error("Error fetching mechanic's appointments:", err); // Log the error for debugging
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

//mechanic order history
router.get("/mechanic-history", verifyFirebaseToken, async (req, res) => {
  try {
    const mechanicId = req.user.uid; // Firebase UID of the logged-in mechanic

    const scheduledBookings = await ServiceBooking.find({
      mechanicId: mechanicId,
    }).sort({ createdAt: -1 });

    res.json({ orders: scheduledBookings });
  } catch (error) {
    console.error("Error fetching mechanic's scheduled history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
