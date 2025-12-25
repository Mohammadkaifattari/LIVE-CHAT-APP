import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  doc, 
  setDoc 
} from "./config.js";

const userNameInput = document.getElementById("signupName");
const emailInput = document.getElementById("signupEmail");
const passwordInput = document.getElementById("signupPassword");
const signupBtn = document.querySelector("button");

window.signup = async (event) => {
  event.preventDefault();

  const nameVal = userNameInput.value.trim();
  const emailVal = emailInput.value.trim();
  const passVal = passwordInput.value;

  if (!nameVal || !emailVal || !passVal) {
    alert("Please fill all fields!");
    return;
  }

  signupBtn.disabled = true;
  signupBtn.innerText = "Creating Account...";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passVal);
    const user = userCredential.user;
    
    await setDoc(doc(db, "users", user.uid), {
      UserName: nameVal,      
      email: emailVal,
      userId: user.uid,
      friends: [],
      sendrequest: [],      
      createdAt: new Date().toISOString()
    });

    alert("Account created successfully!");
    window.location.replace("dashboard.html");

  } catch (error) {
    console.error("Signup Error:", error);
    alert(error.message);
  } finally {
    signupBtn.disabled = false;
    signupBtn.innerText = "Sign Up";
  }
};