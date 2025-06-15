const admin = require("firebase-admin");
const User = require("../models/User");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  // Log the Authorization header
  // console.log("Authorization Header:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  // console.log("Extracted Token:", token); // Log the token

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    // console.log("Decoded Firebase Token:", decodedToken);

    // Find the user by Firebase UID
    // const user = await User.findOne({ firebaseUID: decodedToken.uid });
    // if (!user) {
    //   return res.status(404).json({ message: "User not found" });
    // }
    // Attach user details to the request object
    req.user = decodedToken;
    // console.log("req.user after token verification:", req.user);
    next();
  } catch (err) {
    console.error("Token verification failed:", err); // Log error
    res
      .status(400)
      .json({ message: "Invalid Firebase token", error: err.message });
  }
};

module.exports = verifyFirebaseToken;
