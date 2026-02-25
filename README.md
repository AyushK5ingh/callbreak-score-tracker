# 🃏 Call Break Score Tracker (Premium Edition)

A professional, high-performance score tracking application built specifically for Ayush, Harsh, and Mohit. Features a premium design system with interactive themes, real-time cloud sync, and advanced game analytics.

![Version](https://img.shields.io/badge/version-3.0.0-emerald)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android-blue)
![Cloud](https://img.shields.io/badge/cloud-Firebase%20Sync-orange)

## ✨ Premium Features

### 🎨 Interactive Themes
Switch between four distinct visual and auditory personalities:
- **Emerald Aurora**: The classic premium look with smooth green gradients.
- **Casino Night 🎲**: Deep forest green "felt" aesthetic with red/gold accents.
- **Cyberpunk ⚡**: High-contrast neon purple/cyan on a black background.
- **Classic Deck 🃏**: Tactile paper texture with leather brown accents.
*All themes include custom audio oscillator profiles for a unique sound experience.*

### ✍️ Advanced Scoring & Correction
- **Edit Previous Rounds**: Made a mistake? Click the lock icon on any round to correct the tricks made.
- **Live Recalculation**: The leaderboard and all subsequent rounds update instantly upon saving edits.
- **Smart Validation**: Bid locking countdown and 17-hand interlocking to prevent data entry errors.

### 📊 Professional Analytics
- **Live Nicknames**: Automated badges like "Aggressor" or "Safeboy" based on playing style.
- **Hall of Fame**: Tracking most wins, highest single-round scores, and comeback records.
- **Trend Charts**: Visual match progression graphs for every game.

### ☁️ Cloud Sync & Persistence
- **Firebase Backend**: Real-time backup of every round.
- **Multi-Device Support**: Start on one device, continue on another. 

## 🚀 Tech Stack
- **Frontend**: React 19 + Vite (SWC)
- **Styling**: Tailwind CSS v4 (Custom Theme Engine)
- **Database**: Firebase Firestore (Real-time Sync)
- **Storage**: LocalStorage + Cloud Hybrid
- **Sensory**: Web Audio API (Oscillator Synthesis) + Haptic Feedback
- **Mobile Foundation**: Capacitor v8

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
   npx cap sync
   ```
2. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

## 📄 License
Created for personal use by Ayush & Squad.
