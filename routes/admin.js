const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { verifyRole } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const mongoose = require("mongoose");
const moment = require("moment");
const EmergencyRequest = require("../models/EmergencyRequest");
const ServiceBooking = require("../models/ScheduledService");
const ServiceCenter = require("../models/ServiceCenter");

// Ensure only admins can access these routes

// Admin Dashboard Stats
router.get(
  "/admin-dashboard-stats",
  verifyFirebaseToken,
  verifyRole("Admin"),
  async (req, res) => {
    try {
      // Get pending mechanic approvals
      const pendingApprovals = await User.countDocuments({
        role: "Mechanic",
        approved: false,
      });

      // Get active mechanics (approved mechanics)
      const activeMechanics = await User.countDocuments({
        role: "Mechanic",
        approved: true,
      });

      // Get today's date range
      const todayStart = moment().startOf("day").toDate();
      const todayEnd = moment().endOf("day").toDate();
      console.log(todayStart);
      console.log(todayEnd);

      // Get today's emergency bookings count
      const todayEmergencyBookings = await EmergencyRequest.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });
      console.log(todayEmergencyBookings);
      // Get today's scheduled bookings count
      const todayScheduledBookings = await ServiceBooking.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });
      console.log(todayScheduledBookings);
      // Calculate total bookings for today
      const todayBookings = todayEmergencyBookings + todayScheduledBookings;
      // Get total revenue for today

      // Get total revenue for today's emergency bookings
      const emergencyRevenue = await EmergencyRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart, $lte: todayEnd },
            status: "Completed", // Consider only completed bookings
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: "$amount" } }, // Sum the amountPaid field
          },
        },
      ]);

      // // Get total revenue for today's scheduled bookings
      const scheduledRevenue = await ServiceBooking.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart, $lte: todayEnd },
            status: "Completed", // Consider only completed bookings
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: "$amount" } }, // Sum the amountPaid field
          },
        },
      ]);

      // // Calculate total earnings for today
      const totalEarnings =
        (emergencyRevenue.length > 0 ? emergencyRevenue[0].total : 0) +
        (scheduledRevenue.length > 0 ? scheduledRevenue[0].total : 0);

      res.json({
        pendingApprovals,
        activeMechanics,
        todayBookings,
        totalEarnings,
      });
    } catch (err) {
      console.error("Error fetching admin dashboard stats:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Get all users (Admin Only)
router.get(
  "/getallusers",
  verifyFirebaseToken,
  verifyRole("Admin"),
  async (req, res) => {
    try {
      // Fetch all users
      const users = await User.find({ role: { $in: ["User", "Mechanic"] } });
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Get all mechanics
router.get("/mechanics", async (req, res) => {
  try {
    // Fetch approved and pending mechanics separately
    const approvedMechanics = await User.find({
      role: "Mechanic",
      approved: true,
      suspended: false,
    });
    const pendingMechanics = await User.find({
      role: "Mechanic",
      approved: false,
      suspended: false,
    });

    res.json({
      approvedMechanics,
      pendingMechanics,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

//get all bookings
router.get("/bookings", async (req, res) => {
  try {
    // Fetch all emergency service requests
    const emergencyRequests = await EmergencyRequest.find().sort({
      createdAt: -1,
    });

    // Fetch all scheduled service bookings
    const scheduledBookings = await ServiceBooking.find().sort({
      createdAt: -1,
    });

    res.json({
      emergencyRequests,
      scheduledBookings,
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to add a new service center (Admin Only)
router.post("/service-centers", async (req, res) => {
  try {
    const { name, address, contactInfo, location, workingHours, services } =
      req.body;

    // Validate required fields
    if (
      !name ||
      !address ||
      !contactInfo ||
      !location ||
      !location.coordinates
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create a new service center
    const newServiceCenter = new ServiceCenter({
      name,
      address,
      contactInfo,
      location: {
        type: "Point",
        coordinates: location.coordinates, // [longitude, latitude]
      },
      workingHours,
      services,
      ratings: {
        average: 0,
        totalReviews: 0,
      },
    });

    await newServiceCenter.save();
    res.status(201).json({
      message: "Service center added successfully",
      serviceCenter: newServiceCenter,
    });
  } catch (err) {
    console.error("Error adding service center:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//get specific mechanic
router.get("/mechanic/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mechanic = await User.findById(id);
    if (!mechanic) {
      return res.status(404).json({ message: "Mechanic not found" });
    }
    res.status(200).json(mechanic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve Mechanic Route (Admin Only)
router.post("/approve-mechanic/:id", async (req, res) => {
  try {
    const mechanicId = req.params.id;

    // Validate ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(mechanicId);

    // Find mechanic by _id or firebaseUID
    let mechanic = isValidObjectId
      ? await User.findById(mechanicId)
      : await User.findOne({ firebaseUID: mechanicId });

    if (!mechanic || mechanic.role !== "Mechanic") {
      return res.status(404).json({ message: "Mechanic not found" });
    }

    // Check if already approved
    if (mechanic.approved) {
      return res.status(400).json({ message: "Mechanic is already approved" });
    }

    // Approve mechanic
    mechanic.approved = true;
    await mechanic.save();

    res.json({
      message: "Mechanic approved successfully",
      mechanic: {
        _id: mechanic._id,
        name: mechanic.name,
        email: mechanic.email,
        phoneNumber: mechanic.phoneNumber,
        approved: mechanic.approved,
      },
    });
  } catch (err) {
    console.error("Error approving mechanic:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get pending mechanics
router.get("/pending-mechanics", async (req, res) => {
  try {
    const mechanics = await User.find({ role: "Mechanic", approved: false });
    res.json(mechanics);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Reject mechanic
router.post("/reject-mechanic/:id", async (req, res) => {
  try {
    const mechanicId = req.params.id;
    const mechanic = await User.findById(mechanicId);
    if (!mechanic || mechanic.role !== "Mechanic") {
      return res.status(404).json({ message: "Mechanic not found" });
    }
    await User.findByIdAndDelete(mechanicId);
    res.json({ message: "Mechanic rejected and removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Suspend a user or mechanic
router.post("/suspend-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    let user;
    if (isValidObjectId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ firebaseUID: userId });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.suspended) {
      return res
        .status(400)
        .json({ message: `${user.role} is already suspended` });
    }
    user.suspended = true;
    await user.save();
    res.json({ message: `${user.role} suspended successfully` });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Unsuspend a user or mechanic
router.post(
  "/unsuspend-user/:id",
  verifyFirebaseToken,
  verifyRole("Admin"),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
      let user;
      if (isValidObjectId) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ firebaseUID: userId });
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.suspended) {
        return res
          .status(400)
          .json({ message: `${user.role} is already unsuspended` });
      }
      user.suspended = false;
      await user.save();
      res.json({ message: `${user.role} unsuspended successfully` });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

module.exports = router;
