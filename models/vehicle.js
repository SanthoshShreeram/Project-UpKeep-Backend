const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user
    vehicleType: { type: String, enum: ["motorcycle", "car"], required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "EV"],
      required: true,
    },
    lastServiceDate: { type: Date }, // Storing as Date type for better querying
    Mileage: { type: Number, default: 20 },
    calcMileage: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", VehicleSchema);
