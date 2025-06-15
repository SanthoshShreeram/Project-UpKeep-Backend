const express = require("express");
const router = express.Router();
const { verifyRole } = require("../middlewares/authMiddleware");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const User = require("../models/User");

// Sample mechanic-only route
router.get("/mechanic-dashboard", verifyRole("Mechanic"), (req, res) => {
  res.json({ message: "Welcome to the Mechanic Dashboard!" });
});

// Update mechanic location
router.post("/update-location", verifyRole("Mechanic"), async (req, res) => {
  const { phoneNumber, latitude, longitude } = req.body;
  try {
    const mechanic = await User.findOne({ phoneNumber, role: "Mechanic" });
    if (!mechanic)
      return res.status(404).json({ message: "Mechanic not found" });
    // Update location
    mechanic.location = { latitude, longitude };
    await mechanic.save();
    res.json({ message: "Location updated successfully" });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update mechanic availability and location
router.post(
  "/update-availability",
  verifyFirebaseToken, // Ensure token is verified first
  verifyRole("Mechanic"),
  async (req, res) => {
    const { phoneNumber, isAvailable, latitude, longitude } = req.body;
    const firebaseUID = req.user.uid; // Extracted from the token

    try {
      const mechanic = await User.findOne({ firebaseUID, role: "Mechanic" });
      if (!mechanic)
        return res.status(404).json({ message: "Mechanic not found" });
       if (mechanic.suspended) {
         return res
           .status(403)
           .json({
             success: false,
             message:
               "Your account is suspended. You cannot change availability.",
           });
       }
      // Update availability status and location
      mechanic.isAvailable = isAvailable;
      mechanic.location = { latitude, longitude };
      await mechanic.save();

      res.json({
        message: "Availability and location updated successfully",
        isAvailable,
        location: mechanic.location,
      });
    } catch (err) {
      console.error("Error updating availability and location:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


module.exports = router;
