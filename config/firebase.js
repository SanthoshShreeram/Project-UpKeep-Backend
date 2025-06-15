const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin
  .auth()
  .listUsers(1)
  .then(() => {
    console.log("Firebase initialized successfully");
  })
  .catch((err) => {
    console.error("Firebase initialization failed:", err);
  });

module.exports = admin;
