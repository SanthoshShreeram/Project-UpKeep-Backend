const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["User", "Mechanic", "Admin"],
      default: "User",
    },
    email: { type: String }, // New field for email
    gender: { type: String, enum: ["Male", "Female", "Others"] }, // New field for gender
    approved: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
    servicePreference: {
      type: String,
      enum: ["Emergency service only", "Scheduled service only", "Both"],
      default: "Both",
    }, // Array of services the mechanic can offer
    isAvailable: { type: Boolean, default: true }, // Availability field
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    firebaseUID: { type: String, required: true },

    aadharNumber: { type: String, unique: true, sparse: true }, // Aadhaar number for verification
    profileImage: { type: String }, // URL to the profile image
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
