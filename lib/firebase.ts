import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrsu4YdMiO_KaXbqwF6HThAWkqYwDhvww",
  authDomain: "my-web-app-58073.firebaseapp.com",
  projectId: "my-web-app-58073",
  storageBucket: "my-web-app-58073.firebasestorage.app",
  messagingSenderId: "549794649492",
  appId: "1:549794649492:web:3a0ea10c064810dee6ab81",
  measurementId: "G-XZJCQDFQ6W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
