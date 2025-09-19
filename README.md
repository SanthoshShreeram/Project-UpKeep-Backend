🚗 UpKeep — Frontend (React Native)
UpKeep is a vehicle service management mobile application that helps users handle emergency roadside assistance, schedule vehicle services, and locate nearby service centers easily. This repository contains the mobile app built using React Native.

✨ Features
🔐 OTP-based Authentication with Firebase

🚨 Emergency Roadside Assistance Requests

📅 Scheduled Vehicle Service Booking

🏬 Nearby Service Center Finder (Google Maps API)

🛠️ Real-time Mechanic Location Tracking

📊 Fuel & Mileage Tracker (with efficiency calculation)

🔔 AI-powered Notifications & Personalized Reminders

🛠️ Tech Stack
React Native (Expo)

Firebase Authentication

Google Maps API

AsyncStorage (for local storage)

React Navigation v6

Axios (for API calls)

⚙️ Setup & Installation
Clone the Repository:

bash
Copy
Edit
git clone https://github.com/yourusername/UpKeep-Frontend.git
cd UpKeep-Frontend
Install Dependencies:

bash
Copy
Edit
npm install
Configure Environment Variables:

Create a .env file in the root directory (refer to .env.example):

ini
Copy
Edit
API_BASE_URL=<Your_Backend_API_URL>
GOOGLE_MAPS_API_KEY=<Your_Google_Maps_API_Key>
Start the Development Server:

bash
Copy
Edit
npx expo start
📁 Folder Structure
bash
Copy
Edit
/assets               # App assets (images, icons)
/components          # Reusable components (Buttons, Cards)
/screens             # All screen files (Home, Login, Service Booking, etc.)
/navigation          # React Navigation configurations
/services            # API service calls (Axios clients)
/utils               # Helper functions, constants
App.js               # Main App entry
📸 Screenshots (Optional)
(Add app screenshots here if you want to showcase the UI to recruiters)

📝 License
This project is licensed under the MIT License.

🤝 Contribution
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

👨‍💻 Developed by
Santhosh Shreeram