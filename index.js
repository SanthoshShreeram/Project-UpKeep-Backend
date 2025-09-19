const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const mechanicRoutes = require("./routes/Mechanic.js");
const adminRoutes = require("./routes/admin");
const emergencyRoutes = require("./routes/emergency.js");
const scheduleRoutes = require("./routes/schedule.js");
const serviceCenterRoutes = require("./routes/nearbyservice.js");
const dotenv = require("dotenv");
dotenv.config();
const MONGODBURL = process.env.MONGODBURL;
const PORT = process.env.PORT;
const cors = require("cors");

const app = express();

// Allow all origins for development
app.use(cors());

//middleware
app.use(express.json());

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/mechanic", mechanicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/service-center", serviceCenterRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Hello from node");
});
app.get("/privacy_policy", (req, res) => {
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Privacy Policy - UpKeep</title>
      <style>
          :root {
              --primary-color: #0047ab;
              --secondary-color: #ffffff;
              --background-color: #f4f6f8;
              --text-color: #333;
              --border-color: #ddd;
              --accent-color: #0056b3;
          }

          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: var(--background-color);
              color: var(--text-color);
              margin: 0;
              padding: 0;
          }

          .container {
              max-width: 900px;
              margin: 40px auto;
              padding: 20px;
              background-color: var(--secondary-color);
              border-radius: 12px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          }

          h1 {
              text-align: center;
              text-transform: uppercase;
              font-size: 2.0em;
              color: var(--primary-color);
              border-bottom: 3px solid var(--primary-color);
              padding-bottom: 10px;
              margin-bottom: 30px;
          }

          h2 {
              color: var(--primary-color);
              border-left: 5px solid var(--primary-color);
              padding-left: 10px;
              margin-top: 40px;
              font-size: 1.5em;
          }

          h3 {
              color: var(--accent-color);
              margin-top: 25px;
              font-size: 1.2em;
          }

          p {
              background-color: #fff;
              padding: 15px;
              border-left: 4px solid #eee;
              border-radius: 5px;
              margin: 20px 0;
              line-height: 1.7;
          }

          ul {
              background-color: #fff;
              padding: 15px 20px;
              border: 1px solid var(--border-color);
              border-radius: 5px;
              list-style-type: disc;
              margin: 20px 0;
              padding-left: 40px;
          }

          ul li {
              margin-bottom: 10px;
          }

          a {
              color: var(--primary-color);
              text-decoration: none;
              font-weight: 600;
          }

          a:hover {
              text-decoration: underline;
          }

          .contact {
              background-color: #e9f0f8;
              border-left: 5px solid var(--primary-color);
              padding: 20px;
              border-radius: 6px;
              margin-top: 30px;
          }

          .contact ul {
              list-style: none;
              padding: 0;
          }

          .contact ul li {
              margin-bottom: 12px;
              font-size: 1.05em;
          }

          @media (max-width: 600px) {
              .container {
                  margin: 20px;
                  padding: 15px;
              }

              h1 {
                  font-size: 1.8em;
              }

              h2 {
                  font-size: 1.3em;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>Privacy Policy - UpKeep</h1>
          <p><strong>Last updated:</strong> March 2025</p>
          <p>
              Welcome to <strong>UpKeep</strong>, your all-in-one vehicle assistance app. Your privacy is important to us, and we are committed to protecting your personal information.
          </p>

          <p>This Privacy Policy outlines:</p>
          <ul>
              <li>What data we collect and how we use it.</li>
              <li>How we store and secure your data.</li>
              <li>Your rights regarding your data.</li>
              <li>How to contact us for concerns or inquiries.</li>
          </ul>

          <h2>1. Data We Collect</h2>
          <h3>1.1 Personal Information</h3>
          <p>When you register or use our services, we may collect:</p>
          <ul>
              <li>Full name</li>
              <li>Phone number (used for OTP login via Firebase)</li>
              <li>Email address</li>
              <li>Gender (for personalization)</li>
              <li>Location data (used for nearby services and tracking)</li>
          </ul>

          <h3>1.2 Usage Data</h3>
          <ul>
              <li>IP address and device info</li>
              <li>App usage statistics</li>
              <li>Activity timestamps</li>
              <li>Crash logs and diagnostics</li>
          </ul>

          <h3>1.3 Location Data</h3>
          <ul>
              <li>Mechanics: Real-time background tracking (when available).</li>
              <li>Users: Location for nearby mechanic/service center detection.</li>
          </ul>

          <h3>1.4 Payment Information</h3>
          <p>Payments are handled securely through third-party gateways. We do not store your card details.</p>

          <h2>2. How We Use Your Data</h2>
          <p>We use your data to:</p>
          <ul>
              <li>Authenticate users securely via Firebase.</li>
              <li>Connect users to nearby mechanics or garages.</li>
              <li>Enable real-time mechanic tracking.</li>
              <li>Manage bookings and service records.</li>
              <li>Send updates, alerts, and suggestions.</li>
              <li>Enhance app performance and reliability.</li>
          </ul>

          <h2>3. Data Security</h2>
          <p>Security measures include:</p>
          <ul>
              <li>Firebase Authentication</li>
              <li>HTTPS communication</li>
              <li>Role-based access for different user types</li>
              <li>Regular updates and audits</li>
          </ul>

          <h2>4. Your Rights</h2>
          <p>You can:</p>
          <ul>
              <li>View and update your profile</li>
              <li>Request data correction or deletion</li>
              <li>Delete your account</li>
              <li>Opt out of promotional messages</li>
          </ul>

          <h2>5. Third-Party Services</h2>
          <ul>
              <li>Firebase (authentication & notifications)</li>
              <li>Google Maps API (location services)</li>
              <li>Payment gateways (secure transactions)</li>
          </ul>
          <p>All providers are required to handle your data securely and responsibly.</p>

          <h2>6. Children's Privacy</h2>
          <p>UpKeep is not designed for children under 13. If we detect such data, it will be deleted promptly.</p>

          <h2>7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy. All changes will be reflected in-app and on our website.</p>

          <h2>8. Contact Us</h2>
          <p>If you have any questions or concerns, please contact us:</p>
          <div class="contact">
              <ul>
                  <li>Email: <a href="mailto:support@bookmycaterer.com">support@bookmycaterer.com</a></li>
                  <li>App: Use the "Contact Us" section in the settings menu.</li>
              </ul>
          </div>
      </div>
  </body>
  </html>`);
});

app.get("/delete_user", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delete Account - UpKeep</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f4f4f9;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 400px;
            text-align: center;
        }
        input, textarea {
            width: 90%;
            padding: 12px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 16px;
        }
        button {
            background-color: #ff4d4d;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #e43f3f;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Delete Your Account</h2>
        <p>We're sad to see you go. Please fill out the form below to delete your account.</p>
        <form id="deleteForm" onsubmit="return handleDelete(event)">
            <input type="text" id="name" placeholder="Enter your name" required>
            <input type="email" id="email" placeholder="Enter your email" required>
            <input type="password" id="password" placeholder="Enter your password" required>
            <textarea id="reason" placeholder="Why are you leaving? (Optional)"></textarea>
            <button type="submit">Delete My Account</button>
        </form>
    </div>

    <script>
        function handleDelete(event) {
            event.preventDefault(); // Prevent default form submission
            document.body.innerHTML = "<h1 style='text-align: center; margin-top: 20%; font-family: Arial, sans-serif;'>Your account deletion request has been received. We will process it shortly.</h1>";
        }
    </script>
</body>
</html>
`);
});
//DB connection
mongoose
  .connect(
    MONGODBURL
  )
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.log(error);
    
    console.log("Connection failed");
  });
