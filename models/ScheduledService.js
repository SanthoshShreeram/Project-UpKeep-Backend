const mongoose = require("mongoose");

const serviceBookingSchema = new mongoose.Schema(
  {
    service: { type: String },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    mechanicId: {
      type: String,
      ref: "User",
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    date: {
      type: String, // Stored as 'YYYY-MM-DD'
      required: true,
    },
    time: {
      type: String, // Stored as 'HH:mm'
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    vehicle: {
      name: { type: String, required: true }, // e.g., "Toyota Corolla"
      modelYear: { type: String }, // e.g., "2022"
      fuelType: {
        type: String,
        required: true,
        enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
      },
      vehicleType: {
        type: String,
        enum: ["motorcycle", "car"],
        required: true,
      },
    },
    amount: { type: String },
    paymentId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

const ServiceBooking = mongoose.model("ServiceBooking", serviceBookingSchema);

module.exports = ServiceBooking;
