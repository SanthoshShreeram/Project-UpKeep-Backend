const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: String, // Firebase UID of the reviewer (user or mechanic)
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ["User", "Mechanic"],
      required: true,
    },
    reviewedEntityId: {
      type: String,
      required: true, // Firebase UID (if reviewing user/mechanic) OR Service Center ID
    },
    entityType: {
      type: String,
      enum: ["User", "Mechanic", "ServiceCenter"], // The entity being reviewed
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500, // Limit review comment length
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewSchema);
