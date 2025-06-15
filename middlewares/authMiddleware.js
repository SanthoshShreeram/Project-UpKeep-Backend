const User = require("../models/User");

// Middleware to verify role-based access
const verifyRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // Extract the Firebase UID from req.user (populated by verifyFirebaseToken)
      // console.log("req.user in verifyRole:", req.user);
      const firebaseUID = req.user?.uid; // Ensure user is populated
      // console.log(firebaseUID);

      if (!firebaseUID) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No Firebase token" });
      }
      // Find the user in the database by Firebase UID
      const user = await User.findOne({ firebaseUID });

      // console.log("Firebase UID from token:", firebaseUID);
      // console.log("User found:", user);

      if (!user) return res.status(404).json({ message: "User not found" });
      // Check if the user's role matches the required role
      if (user.role !== requiredRole) {
        return res.status(403).json({ message: "Access denied" });
      }
      // Proceed if role matches
      next();
    } catch (err) {
      console.error("Error verifying role:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };
};

module.exports = { verifyRole };
