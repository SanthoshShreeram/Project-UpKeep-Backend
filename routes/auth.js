const express = require("express");
const router = express.Router();
const admin = require("../config/firebase");
const User = require("../models/User");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const Vehicle = require("../models/vehicle");
const Review = require("../models/Review");

const mileageData = {
  Activa: 50,
  Shine: 55,
  Unicorn: 45,
  CB350: 40,
  CB500X: 28,
  R15: 35,
  FZ: 40,
  "MT-15": 45,
  Fascino: 50,
  "Classic 350": 35,
  Meteor: 32,
  Himalayan: 33,
  Swift: 22,
  Brezza: 19,
  Ertiga: 18,
  i20: 20,
  Venue: 19,
  Creta: 18,
  Nexon: 20,
  Altroz: 22,
  Harrier: 15,
  Safari: 14,
  "Nexon EV": 350, // EV range in km per full charge
};

// Verify OTP and Authenticate User
router.post("/verify-otp", async (req, res) => {
  const { idToken, name, role } = req.body; // Frontend sends Firebase ID token
  console.log("Received ID token:", idToken); // Log received token
  if (!idToken) {
    return res.status(400).json({ message: "ID token is required" });
  }
  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded Token:", decodedToken);

    // Extract phone number from token
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number missing in token" });
    }

    // Check if user exists in the database
    let user = await User.findOne({ phoneNumber });

    // Store a flag before creating the user
    const isNewUser = !user;

    // If user doesn't exist, register them
    if (isNewUser) {
      // Validate role
      const validRoles = ["User", "Mechanic"];
      const assignedRole = validRoles.includes(role) ? role : "User";

      user = new User({
        name: name || "Unknown",
        phoneNumber,
        role: assignedRole, // Set only valid roles
        firebaseUID: decodedToken.uid, // Store Firebase UID
      });

      await user.save();
    }

    res.status(200).json({
      message: "OTP verified successfully",
      isNewUser, // true if user is new, false if already exists
      user: {
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        firebaseUID: user.firebaseUID,
      },
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res
      .status(400)
      .json({ message: "Invalid Firebase token", error: err.message });
  }
});

// Update Personal Details
router.post("/personal-details", verifyFirebaseToken, async (req, res) => {
  const { name, gender, email } = req.body;
  const firebaseUID = req.user.uid; // Extracted from the token

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    user.name = name || user.name;
    user.gender = gender || user.gender;
    user.email = email || user.email;

    await user.save();

    res.status(200).json({ message: "Personal details updated successfully" });
  } catch (error) {
    console.error("Error updating personal details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Profile
router.get("/profile", verifyFirebaseToken, async (req, res) => {
  try {
    console.log("Extracted Firebase UID:", req.user.uid);
    const firebaseUID = req.user.uid; // Extract user ID from Firebase token

    const user = await User.findOne({ firebaseUID }); // Fetch user from DB

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Optional: Check if the user is suspended
    if (user.suspended) {
      return res.status(403).json({
        message: "Your account is suspended. Please contact support.",
      });
    }
    // Return filtered user details
    res.json({
      name: user.name,
      gender: user.gender,
      email: user.email,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add or Update Vehicle Details
router.post("/vehicle-details", verifyFirebaseToken, async (req, res) => {
  const { vehicleType, manufacturer, model, year, fuelType, lastServiceDate } =
    req.body;
  const firebaseUID = req.user.uid; // Extracted from the token
  const expectedMileage = mileageData[model] || 20;
  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let vehicle = await Vehicle.findOne({ user: user._id });

    if (vehicle) {
      // Update existing vehicle details
      vehicle.vehicleType = vehicleType || vehicle.vehicleType;
      vehicle.manufacturer = manufacturer || vehicle.manufacturer;
      vehicle.model = model || vehicle.model;
      vehicle.year = year || vehicle.year;
      vehicle.fuelType = fuelType || vehicle.fuelType;
      vehicle.lastServiceDate = lastServiceDate || vehicle.lastServiceDate;
      vehicle.Mileage = expectedMileage || vehicle.expectedMileage; // <- Add this in update too if you want
      vehicle.calcMileage = " ";
    } else {
      // Create new vehicle entry
      vehicle = new Vehicle({
        user: user._id,
        vehicleType,
        manufacturer,
        model,
        year,
        fuelType,
        lastServiceDate,
        Mileage: expectedMileage,
      });
    }

    await vehicle.save();
    res
      .status(200)
      .json({ message: "Vehicle details saved successfully", vehicle });
  } catch (error) {
    console.error("Error saving vehicle details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/update-calc-mileage", verifyFirebaseToken, async (req, res) => {
  const { calcMileage } = req.body;
  const firebaseUID = req.user.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let vehicle = await Vehicle.findOne({ user: user._id });
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    vehicle.calcMileage = calcMileage;
    await vehicle.save();

    res
      .status(200)
      .json({ message: "calcMileage updated successfully", vehicle });
  } catch (error) {
    console.error("Error updating calcMileage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/vehicle-details", verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const user = await User.findOne({ firebaseUID });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const vehicle = await Vehicle.findOne({ user: user._id });

    if (!vehicle) {
      return res.status(404).json({ message: "No vehicle details found" });
    }

    res.status(200).json({
      vehicle,
      userName: user.name,
    });
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
//review
router.post("/review", verifyFirebaseToken, async (req, res) => {
  try {
    const reviewerId = req.user.uid;
    const { reviewerRole, reviewedEntityId, entityType, rating, comment } =
      req.body;

    // Validate required fields
    if (!reviewerRole || !reviewedEntityId || !entityType || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate rating value
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Create a new review
    const newReview = new Review({
      reviewerId,
      reviewerRole,
      reviewedEntityId,
      entityType,
      rating,
      comment,
    });

    await newReview.save();
    res
      .status(201)
      .json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Get reviews for a specific Service Center
router.get("/review-center/:centerId", async (req, res) => {
  try {
    const { centerId } = req.params;

    const reviews = await Review.find({
      reviewedEntityId: centerId,
      entityType: "ServiceCenter",
    }).sort({ createdAt: -1 }); // Sort by most recent

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching service center reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//mechanic profile
router.get("/mechanic/details", verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.uid;

    // Find the mechanic using the Firebase UID
    const mechanic = await User.findOne({
      firebaseUID,
      role: "Mechanic",
    }).select(
      "name phoneNumber email gender approved suspended servicePreference isAvailable location aadharNumber profileImage"
    );

    if (!mechanic) {
      return res.status(404).json({ message: "Mechanic not found" });
    }

    res.status(200).json(mechanic);
  } catch (error) {
    console.error("Error fetching mechanic details:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Get mechanic's service preference
router.get("/mechanic/preference", verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.uid;

    const mechanic = await User.findOne({
      firebaseUID,
      role: "Mechanic",
    }).select("servicePreference");

    if (!mechanic) {
      return res.status(404).json({ message: "Mechanic not found" });
    }

    res.status(200).json({ servicePreference: mechanic.servicePreference });
  } catch (error) {
    console.error("Error fetching service preference:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Update mechanic's service preference
router.post("/mechanic/preference", verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const { servicePreference } = req.body;

    // Validate input
    if (
      !["Emergency service only", "Scheduled service only", "Both"].includes(
        servicePreference
      )
    ) {
      return res.status(400).json({ message: "Invalid service preference" });
    }

    const mechanic = await User.findOneAndUpdate(
      { firebaseUID, role: "Mechanic" },
      { servicePreference },
      { new: true }
    ).select("servicePreference");

    if (!mechanic) {
      return res.status(404).json({ message: "Mechanic not found" });
    }

    res.status(200).json({
      message: "Service preference updated successfully",
      servicePreference: mechanic.servicePreference,
    });
  } catch (error) {
    console.error("Error updating service preference:", error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
