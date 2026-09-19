<div align="center">

# 💬 Live Chat App

### Real-time premium chat experience — built with Next.js, Firebase, and AI smart replies

[![Live Demo](https://img.shields.io/badge/Live_Demo-FF6A00?style=for-the-badge&logo=vercel&logoColor=white)](https://live-chat-app-red.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/muhammadkaif-dev)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://muhammadkaif.vercel.app)

</div>

---

## ✨ Features

- 🔐 Auth — Email/password + Google sign-in via Firebase Auth
- 👥 Social network — add friends, accept/reject requests, search users
- 💬 Real-time private chat — Firestore `onSnapshot` for live messaging
- ✅ Read receipts — blue `✓✓` = seen, gray `✓✓` = sent
- ⌨️ Typing indicator — real-time typing state via Firestore
- 🟢 Online/offline presence — live user status system
- 🔔 Unread badges — counters for new chats/requests
- 🤖 AI smart replies — Groq-powered suggestions for chat replies
- 🌐 Multi-language AI — supports English, Urdu, Roman Urdu, Hinglish
- 🎨 Premium glassmorphism UI — dark theme with GSAP animations
- 📱 Notifications dashboard — manage incoming friend requests
- 🧠 Smart fallback handling — graceful fallback suggestions when Groq fails

---

## 🛠️ Tech Stack

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)

**Backend & Database**

![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Firestore-FF6F00?style=for-the-badge&logo=firebase&logoColor=white)

**AI**

![Groq](https://img.shields.io/badge/Groq_API-F55036?style=for-the-badge&logoColor=white)

---

## 🗂️ Project Structure

```bash
app/
├── layout.tsx                    # App shell + providers
├── template.tsx                  # GSAP transitions
├── page.tsx                      # App entry redirect
├── auth/
│   ├── login/page.tsx            # Login UI
│   └── signup/page.tsx           # Sign up UI
├── dashboard/
│   ├── layout.tsx                # Auth guard + sidebar
│   ├── page.tsx                  # Social hub
│   ├── notifications/page.tsx    # Friend requests
│   └── chat/
│       ├── page.tsx              # Chat list
│       └── [id]/page.tsx         # Private chat room
└── api/
    └── ai-suggest/
        └── route.ts              # Groq smart reply generation
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Mohammadkaifattari/LIVE-CHAT-APP.git
cd LIVE-CHAT-APP
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
GROQ_API_KEY=your_groq_key
GROQ_API_KEY_2=your_second_groq_key
GROQ_API_KEY_3=your_third_groq_key
GROQ_API_KEY_4=your_fourth_groq_key
GROQ_API_KEY_5=your_fifth_groq_key
GROQ_MODEL=openai/gpt-oss-20b
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### 4. Firebase setup

- Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable **Authentication** and **Firestore**
- Enable email/password signup and Google login
- Copy your config into `lib/firebase.ts`
- Add the Firestore security rules from `firestore.rules`

### 5. Run locally

```bash
npm run dev
```

Open: `http://localhost:3000`

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

This project is deployed on **Vercel**:

- [Live Demo](https://live-chat-app-red.vercel.app)

For production deployment, add these variables in Vercel → Project Settings → Environment Variables:

- `GROQ_API_KEY`
- `GROQ_API_KEY_2`
- `GROQ_API_KEY_3`
- `GROQ_API_KEY_4`
- `GROQ_API_KEY_5`
- `GROQ_MODEL`
- `GROQ_BASE_URL`

---

## 🤖 AI Suggestion Behavior

The AI reply endpoint is implemented in:

```bash
app/api/ai-suggest/route.ts
```

It does the following:

- reads the last conversation context
- sends the latest message history to Groq
- asks for exactly 3 short, natural replies
- parses the JSON response safely
- falls back to a local suggestion list only if the API request fails

---

## 👨‍💻 Author

**Muhammad Kaif** — Full Stack Developer, Karachi 🇵🇰

[![Portfolio](https://img.shields.io/badge/Portfolio-FF6A00?style=for-the-badge&logo=vercel&logoColor=white)](https://muhammadkaif.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/muhammadkaif-dev)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:muhammadkaif1291@gmail.com)
