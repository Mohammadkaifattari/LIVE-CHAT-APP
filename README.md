<div align="center">

# 💬 Live Chat App

### Real-time premium chat experience — built with Next.js, Firebase & AI

[![Live Demo](https://img.shields.io/badge/Live_Demo-FF6A00?style=for-the-badge&logo=vercel&logoColor=white)](https://live-chat-app-red.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/muhammadkaif-dev)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://muhammadkaif.vercel.app)

</div>

---

## ✨ Features

- 🔐 **Auth** — Email/Password + Google Sign-in via Firebase Auth
- 👥 **Social Network** — Add friends, send/accept/reject requests, search users
- 💬 **Real-time Private Chat** — Messages powered by Firestore `onSnapshot`
- ✅ **Read Receipts** — ✓✓ blue = seen, grey = sent
- ⌨️ **Typing Indicator** — Live typing status via Firestore
- 🟢 **Online/Offline Status** — Real-time presence system
- 🔔 **Unread Badge** — Violet pill counter on chat list
- 🤖 **AI Smart Replies** — Groq API (llama-3.3-70b) suggests context-aware replies
- 🌐 **Language-aware AI** — Roman Urdu, English, Urdu, Hinglish support
- 🎨 **Glassmorphism UI** — Dark premium theme with GSAP animations
- 📱 **Notifications Page** — Real-time friend request management

---

## 🛠️ Tech Stack

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=white)

**Backend & Database**

![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Firestore-FF6F00?style=for-the-badge&logo=firebase&logoColor=white)

**AI**

![Groq](https://img.shields.io/badge/Groq_API-F55036?style=for-the-badge&logoColor=white)

---

## 🗂️ Project Structure

```
app/
├── layout.tsx               # AuthProvider + fonts
├── template.tsx             # GSAP page transitions
├── page.tsx                 # Redirect logic
├── auth/
│   ├── login/page.tsx       # Email + Google login
│   └── signup/page.tsx      # Email + Google signup
├── dashboard/
│   ├── layout.tsx           # Auth guard + Sidebar
│   ├── page.tsx             # Social Network (Users/Friends/Requests)
│   ├── notifications/
│   │   └── page.tsx         # Friend requests management
│   └── chat/
│       ├── page.tsx         # Chat list (real-time)
│       └── [id]/page.tsx    # Private chat room
└── api/
    └── ai-suggest/
        └── route.ts         # Groq AI smart replies
```

---

## ⚙️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Mohammadkaifattari/live-chat-app.git
cd live-chat-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env.local` file in the root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Firebase setup

- Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable **Firestore** and **Authentication** (Email/Password + Google)
- Copy your config into `lib/firebase.ts`
- Apply the Firestore security rules from `firestore.rules`

### 5. Run locally

```bash
npm run dev
```

---

## 🔒 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null;
      allow create, delete: if request.auth.uid == userId;
    }
    match /chats/{chatId} {
      allow read, write: if request.auth != null
        && request.auth.uid in chatId.split("_");
      match /messages/{messageId} {
        allow read: if request.auth != null
          && request.auth.uid in chatId.split("_");
        allow create: if request.auth.uid == request.resource.data.senderId
          && request.auth.uid in chatId.split("_");
        allow update: if request.auth != null
          && request.auth.uid in chatId.split("_");
      }
    }
    match /typing/{roomId} {
      allow read, write: if request.auth != null
        && request.auth.uid in roomId.split("_");
    }
    match /presence/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Deployment

Deployed on **Vercel** — [live-chat-app-red.vercel.app](https://live-chat-app-red.vercel.app)

Add `GROQ_API_KEY` in Vercel → Project Settings → Environment Variables.

---

## 👨‍💻 Author

**Muhammad Kaif** — Full Stack Developer, Karachi 🇵🇰

[![Portfolio](https://img.shields.io/badge/Portfolio-FF6A00?style=for-the-badge&logo=vercel&logoColor=white)](https://muhammadkaif.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/muhammadkaif-dev)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:muhammadkaif1291@gmail.com)