// Import specific versions (Updated to the latest stable version - 12.7.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
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
    arrayRemove ,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Firebase configuration (Keep your existing config)
const firebaseConfig = {
    apiKey: "AIzaSyCtaAeFwHgeXioFfSasr6pgi9uhAZtkU04",
    authDomain: "taytay-paplu.firebaseapp.com",
    projectId: "taytay-paplu",
    storageBucket: "taytay-paplu.firebasestorage.app",
    messagingSenderId: "924298031953",
    appId: "1:924298031953:web:2263d83004daef38081970",
    measurementId: "G-X143CMDFG3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exporting everything for your Friend System
export {
    auth,
    db,
    // AUTH FUNCTIONS
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    getAuth,
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
    writeBatch,    // Batch operations ke liye zaroori
    arrayUnion,    // Friends add karne ke liye
    arrayRemove ,
    onSnapshot,
    orderBy,
    serverTimestamp   // Request delete karne ke liye
};

