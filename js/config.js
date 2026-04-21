// Import specific versions (Updated to stable version 11.1.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";

import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc,
    setDoc, 
    getDocs, 
    getDoc,
    updateDoc,
    query, 
    where, 
    writeBatch, 
    arrayUnion, 
    arrayRemove,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrsu4YdMiO_KaXbqwF6HThAWkqYwDhvww",
  authDomain: "my-web-app-58073.firebaseapp.com",
  projectId: "my-web-app-58073",
  storageBucket: "my-web-app-58073.firebasestorage.app",
  messagingSenderId: "549794649492",
  appId: "1:549794649492:web:3a0ea10c064810dee6ab81",
  measurementId: "G-XZJCQDFQ6W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export everything for the Friend System
export {
    auth,
    db,
    getAuth, // Dashboard.js ke liye zaroori hai
    // AUTH FUNCTIONS
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    // FIRESTORE FUNCTIONS
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    writeBatch,
    arrayUnion,
    arrayRemove,
    onSnapshot,
    orderBy,
    serverTimestamp
};