import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "./config.js";
import { showMessage, setBtnLoading } from "./auth.js";

const auth = getAuth();
const loginMessageEl = document.getElementById("loginMessage");

window.signin = async (event) => {
  event.preventDefault();
  
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const submitBtn = event.target.querySelector('button[type="submit"]');

  if (!email || !password) {
    showMessage(loginMessageEl, "Please enter both email and password.", "error");
    return;
  }

  setBtnLoading(submitBtn, true, "Signing In...");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    event.target.reset();
    showMessage(loginMessageEl, "Login successful! Redirecting...", "success");
    
    setTimeout(() => {
      window.location.replace("dashboard.html");
    }, 1500);
  } catch (error) {
    console.error("Login Error:", error);
    let errorMsg = "Login failed. Please check your credentials.";
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      errorMsg = "Invalid email or password.";
    } else if (error.code === "auth/too-many-requests") {
      errorMsg = "Too many failed attempts. Please try again later.";
    }
    showMessage(loginMessageEl, errorMsg, "error");
  } finally {
    setBtnLoading(submitBtn, false);
  }
};

function checkLoginState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Auto redirect if already logged in and on login/home page
      const path = window.location.pathname;
      if (path.includes("index.html") || path.endsWith("/") || path === "") {
         window.location.replace("dashboard.html");
      }
    }
  });
}

checkLoginState();