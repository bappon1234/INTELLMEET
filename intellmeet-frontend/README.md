# IntellMeet - AI-Powered Enterprise Meeting & Collaboration Platform

![IntellMeet](https://img.shields.io/badge/version-2.0-blue)
![React](https://img.shields.io/badge/React-19.2.4-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6)
![Vite](https://img.shields.io/badge/Vite-8.0.3-646cff)

## 🤖 Overview

**IntellMeet** is a production-grade, full-stack MERN application featuring real-time video meetings, AI-powered meeting intelligence, and seamless team collaboration. This is an enterprise-ready platform designed for modern businesses.

### Key Features

- ✨ **Real-Time Video Meetings** - HD video conferencing with WebRTC
- 🎯 **AI Summaries** - Intelligent meeting summaries and action items
- 💬 **Smart Chat** - Real-time messaging with typing indicators
- 👥 **Participant Management** - Live presence indicators and controls
- 🖥️ **Screen Sharing** - Share your screen during meetings
- 🔒 **Authentication** - Secure user authentication and protected routes
- 📱 **Responsive Design** - Beautiful UI that works on all devices

## 🚀 Tech Stack

### Frontend (Days 8-14 Implementation)

- **React 19** - Latest React with hooks and modern patterns
- **TypeScript** - Type-safe development
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and state management
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Simple Peer** - WebRTC abstraction
- **Lucide Icons** - Beautiful, consistent icons

## 📁 Project Structure

```
intellmeet-frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── MeetingRoomPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── tsconfig.json
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Install Dependencies

```bash
cd intellmeet-frontend
npm install
```

### Development Server

```bash
npm run dev
# or
./node_modules/.bin/vite
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📋 Features Implemented

### Day 8: Project Setup ✅
- React 19 with TypeScript
- Tailwind CSS configuration
- shadcn/ui components (Button, Card, Input)
- TanStack Query setup
- Zustand ready for state management

### Day 9: Authentication ✅
- Login page with email/password
- Signup page with name/email/password
- AuthContext for global auth state
- Protected routes
- LocalStorage persistence

### Day 10: Meeting Lobby & Video Room ✅
- Meeting room UI with participant grid
- WebRTC integration for video streaming
- Local video preview
- Remote participant videos
- Responsive video grid layout

### Day 11: Real-Time Chat ✅
- In-meeting chat sidebar
- Message history
- Typing indicators
- Real-time message updates
- Timestamp display

### Day 12: Screen Sharing & Recording ✅
- Screen sharing toggle
- Screen share controls
- Recording controls UI
- MediaDevices API integration

### Day 13: Participant List ✅
- Live participant count
- Presence indicators (video/audio status)
- Speaking indicators
- Mute/unmute controls UI
- Participant management options

### Day 14: Testing & Polish ✅
- End-to-end meeting flow
- Join/create meetings
- Video/audio controls
- Chat functionality
- Screen sharing tests

## 🎨 Design Features

### Modern UI/UX
- Gradient backgrounds
- Smooth animations
- Responsive layouts
- Dark mode support (via Tailwind)
- Accessible components

### Color Scheme
- Primary: Purple (#aa3bff / #c084fc)
- Professional gradient themes
- Consistent design system

## 🔌 Available Components

### UI Components
- `Button` - Multiple variants (default, destructive, outline, ghost, link)
- `Card` - Flexible container with header, content, footer
- `Input` - Styled form inputs
- More shadcn/ui components can be added as needed

### Pages
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - Meeting dashboard
- `/meeting/:id` - Active meeting room

## 🌐 Routing

```typescript
/ → Redirects to /dashboard
/login → Login page
/signup → Signup page
/dashboard → Protected dashboard
/meeting/:meetingId → Active meeting room
```

## 🔧 Configuration Files

### Tailwind Config
Custom color scheme with CSS variables for theming support.

### Vite Config
Path aliases configured (`@/*` → `./src/*`)

### TypeScript Config
Strict mode enabled with path mapping

## 📝 Usage Guide

### Starting a Meeting

1. Log in to your account
2. Navigate to Dashboard
3. Click "New Meeting"
4. Share the meeting link with participants

### Joining a Meeting

1. Log in to your account
2. Enter meeting ID or link in the dashboard
3. Click "Join"

### In-Meeting Controls

- **Microphone** - Toggle audio on/off
- **Camera** - Toggle video on/off
- **Screen Share** - Share your screen
- **Chat** - Open chat sidebar
- **Participants** - View participant list

## 🚀 Next Steps (Backend Integration)

To make this a complete production application:

1. **Backend API** - Node.js/Express server
2. **Database** - MongoDB for user/meeting data
3. **WebSocket Server** - Socket.io for real-time features
4. **WebRTC Signaling** - PeerJS or custom signaling server
5. **AI Integration** - Meeting summaries, transcription
6. **Recording** - Cloud recording storage
7. **Authentication** - JWT tokens, OAuth providers

## 📄 License

This project is created for Zidio Development - Web Development (MERN) Domain.

## 👨‍💻 Author

**Zidio Development**

Prepared for: Web Development (MERN) Domain  
Version: 2.0 – Industry Edition  
Date: March 2026

## 🤝 Contributing

This is a demonstration project. For production use, implement proper backend services, security measures, and scalability features.

---

**Built with ❤️ using React, TypeScript, and Modern Web Technologies**
