// /models/ServiceCenter.js
const mongoose = require("mongoose");

const serviceCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  contactInfo: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  workingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  services: {
    type: [String], // Example: ["Oil Change", "Brake Repair", "Battery Replacement"]
    default: [],
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
});

serviceCenterSchema.index({ location: "2dsphere" }); // Index for geospatial queries

module.exports = mongoose.model("ServiceCenter", serviceCenterSchema);
