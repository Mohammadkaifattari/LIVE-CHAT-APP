import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  doc, 
  setDoc 
} from "./config.js";
import { showMessage, setBtnLoading, isValidEmail } from "./auth.js";

const signupMessageEl = document.getElementById("signupMessage");
const signupBtn = document.querySelector(".btn-primary");

window.signup = async (event) => {
  event.preventDefault();

  const nameVal = document.getElementById("signupName").value.trim();
  const emailVal = document.getElementById("signupEmail").value.trim();
  const passVal = document.getElementById("signupPassword").value;

  if (!nameVal || !emailVal || !passVal) {
    showMessage(signupMessageEl, "Please fill in all fields!", "error");
    return;
  }

  if (!isValidEmail(emailVal)) {
    showMessage(signupMessageEl, "Please enter a valid email address.", "error");
    return;
  }

  if (passVal.length < 6) {
    showMessage(signupMessageEl, "Password should be at least 6 characters.", "error");
    return;
  }

  setBtnLoading(signupBtn, true, "Creating Account...");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passVal);
    const user = userCredential.user;
    
    // Standardized user object for Friend System
    await setDoc(doc(db, "users", user.uid), {
      UserName: nameVal,      
      email: emailVal,
      userId: user.uid,
      friends: [],
      sendrequest: [],    
      friendRequest: [],  
      createdAt: new Date().toISOString()
    });

    showMessage(signupMessageEl, "Account created! Redirecting...", "success");
    
    setTimeout(() => {
      window.location.replace("dashboard.html");
    }, 1500);

  } catch (error) {
    console.error("Signup Error:", error);
    let errorMsg = error.message; // Show the actual message for debugging
    if (error.code === "auth/email-already-in-use") {
        errorMsg = "This email is already registered.";
    } else if (error.code === "auth/invalid-email") {
        errorMsg = "Invalid email address.";
    } else if (error.code === "auth/network-request-failed") {
        errorMsg = "Network error. Please check your internet connection.";
    }
    
    // Adding the specific error code to help the user identify the problem
    showMessage(signupMessageEl, `Signup Error: ${errorMsg} (${error.code || 'Unknown'})`, "error");
  } finally {
    setBtnLoading(signupBtn, false, "Create Account");
  }
};