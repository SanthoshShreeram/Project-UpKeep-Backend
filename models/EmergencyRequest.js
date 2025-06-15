const mongoose = require("mongoose");

const EmergencyRequestSchema = new mongoose.Schema(
  {
    service: { type: String },
    userId: {
      type: String, // Firebase UID of the user who made the request
      required: true,
    },
    location: {
      type: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
      required: true,
    },
    issueType: {
      type: String, // Type of issue (e.g., flat tire, engine failure)
      required: true,
    },
    vehicle: {
      name: { type: String, required: true }, // Vehicle name (e.g., Honda Activa)
      model: { type: String, required: true }, // Model year
      fuelType: { type: String, required: true }, // Fuel type (Petrol/Diesel)
      lastServiceDate: { type: String, default: "Not Available" },
      vehicleType: {
        type: String,
        enum: ["motorcycle", "car"],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Completed", "Cancelled"],
      default: "Pending",
    },
    amount: { type: String },
    rejectedBy: [{ type: String, ref: "Mechanic" }], // Track rejected mechanics
    assignedMechanic: {
      type: String, // Firebase UID of the mechanic
      // ref: "User",
      default: null,
    },
    distance: { type: Number },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

const EmergencyRequest = mongoose.model(
  "EmergencyRequest",
  EmergencyRequestSchema
);

module.exports = EmergencyRequest;
