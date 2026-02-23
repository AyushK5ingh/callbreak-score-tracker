# 🃏 Call Break Score Tracker (Premium Edition)

A professional, high-performance offline score tracking application built specifically for Ayush, Harsh, and Mohit. Features a premium dark aesthetic with real-time analytics and mobile-first optimization.

![Version](https://img.shields.io/badge/version-2.0.0-emerald)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android-blue)
![Offline](https://img.shields.io/badge/offline-Ready-success)

## ✨ Premium Features

### 📊 Professional Scoreboard
- **Round-by-Round Breakdown**: Full transparency for every bid and hand made.
- **Smart Totals**: Real-time automatic summing of scores across all rounds.
- **Ordered Consistency**: Fixed player sorting (**Ayush • Harsh • Mohit**) for muscle-memory data entry.

### 👑 Leaderboard UX
- **Live Leader Tracking**: Top scorer automatically gets the "Leader" badge and trophy icon.
- **Point Gaps**: Competitive badges show exactly how many points players are behind the leader.
- **Locked Call Visibility**: Bids remain visible at the top during gameplay for quick reference.

### 🛡️ Safety & Validation
- **Smart Popups**: Clean, "Deliveroo-inspired" action sheets for critical transitions.
- **Bid Locking**: 3-second countdown to prevent accidental bid changes.
- **17-Hand Interlock**: Validation ensures total hands sum to 17, with a safety confirmation delay.

## 🚀 Tech Stack
- **Frontend**: React 19 + Vite (SWC)
- **Styling**: Tailwind CSS v4 (Custom Dark Theme)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Mobile Foundation**: Capacitor v8
- **Storage**: LocalStorage (100% Offline)

## 🛠️ Local Development

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/AyushK5ingh/callbreak.git

# Install dependencies
npm install
```

### 2. Run Preview
```bash
npm run dev
```

### 3. Build for Web
```bash
npm run build
```

## 📱 Mobile Build (Android)
The app is pre-configured with Capacitor for Android.

1. **Sync Assets**:
   ```bash
   npx cap sync android
   ```
2. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```
3. **Build APK**:
   Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** in Android Studio.

## 📄 License
Created for personal use by Ayush & Squad.
