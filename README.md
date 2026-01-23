# VALENCIRÉ® Luxury Commerce

A production-ready E-commerce application built with React (Vite), Node.js (Express), and SQLite.

## ✅ Prerequisites
- Node.js (v16 or higher)
- NPM

## 🚀 How to Run (Step-by-Step)

### 1. Install Dependencies
If you haven't already:
```bash
npm install
```

### 2. Build the Frontend
Compile the React code into optimized HTML/CSS/JS:
```bash
npm run build
```
*(This creates a `dist/` folder with your app)*

### 3. Start the Server
Run the production server:
```bash
node server.js
```
**OR**
```bash
npm start
```

### 4. Access the App
Open your browser and go to:
[http://localhost:3000](http://localhost:3000)

---

## ⚠️ Important Note on "Killing the Process"
When you run `node server.js`, the terminal **SHOULD** stay open and show:
```
🚀 VALENCIRÉ® Backend running on port 3000
Connected to the SQLite database.
```
**This is normal behavior.** It means the server is **alive and listening**.
- **DO NOT close the terminal.**
- **DO NOT press Ctrl+C** (unless you want to stop the website).
- Minimize the window and go to your browser.

## 🛠 Features
- **Authentication**: Sign Up / Sign In (JWT, Persistent)
- **Dashboard**: View Order History, Profile, Change Password
- **Checkout**: Real Database Orders + Email Notifications (Nodemailer)