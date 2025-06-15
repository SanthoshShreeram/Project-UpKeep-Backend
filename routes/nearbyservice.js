const express = require("express");
const router = express.Router();
const ServiceCenter = require("../models/ServiceCenter");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { verifyRole } = require("../middlewares/authMiddleware");

// add service centers (admin-only)
router.post(
  "/add",
  verifyFirebaseToken,
  verifyRole("Admin"),
  async (req, res) => {
    try {
      const {
        name,
        address,
        contactInfo,
        latitude,
        longitude,
        workingHours,
        services,
      } = req.body;

      // Validate required fields
      if (!name || !address || !contactInfo || !latitude || !longitude) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Create new service center
      const newServiceCenter = new ServiceCenter({
        name,
        address,
        contactInfo,
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        workingHours: workingHours || {
          monday: { open: "08:00", close: "18:00" },
          tuesday: { open: "08:00", close: "18:00" },
          wednesday: { open: "08:00", close: "18:00" },
          thursday: { open: "08:00", close: "18:00" },
          friday: { open: "08:00", close: "18:00" },
          saturday: { open: "09:00", close: "15:00" },
          sunday: { open: "Closed", close: "Closed" },
        },
        services: services || [],
        ratings: {
          average: 0,
          totalReviews: 0,
        },
      });

      await newServiceCenter.save();
      res.json({ message: "Service center added successfully" });
    } catch (err) {
      console.error("Error adding service center:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Route: GET /service-center/nearby?lat=...&lng=...
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    // Find nearby service centers within a 10km radius
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const nearbyCenters = await ServiceCenter.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance", // Distance will be added to each document
          spherical: true,
          maxDistance: 10000, // 10 km
        },
      },
      {
        $project: {
          name: 1,
          address: 1,
          contactInfo: 1,
          location: 1,
          distance: { $round: [{ $divide: ["$distance", 1000] }, 2] }, // Convert to km & round to 2 decimals
        },
      },
    ]);

    res.json({ nearbyCenters });
  } catch (err) {
    console.error("Error fetching nearby service centers:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//get specific service center details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the service center by ID
    const serviceCenter = await ServiceCenter.findById(id);

    if (!serviceCenter) {
      return res.status(404).json({ message: "Service center not found" });
    }

    res.json(serviceCenter);
  } catch (err) {
    console.error("Error fetching service center details:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
