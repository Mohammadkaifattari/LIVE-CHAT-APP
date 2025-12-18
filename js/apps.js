// Pehle simple console.log check karein
console.log("Script loaded successfully!");

import { createUserWithEmailAndPassword, onAuthStateChanged, getAuth, doc, setDoc, db  } from "./config.js";
  const UserName = document.getElementById("signupName")
  const email = document.getElementById("signupEmail")
  const password = document.getElementById("signupPassword")


console.log("Config imported successfully!");

const auth = getAuth();
console.log("Auth object:", auth);

window.signup = async (event) => {
  event.preventDefault();
  console.log("Signup process started...");

  const nameVal = UserName.value;
  const emailVal = email.value;
  const passVal = password.value;

  try {
    // Step 1: Auth Create karna
    const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passVal);
    const user = userCredential.user;
    alert("Auth Successful! ID: " + user.uid); // Pehla check

    // Step 2: Firestore mein data save karna
    // Hum yahan direct setDoc use kar rahe hain taake koi confusion na rahe
    await setDoc(doc(db, "users", user.uid), {
      UserName: nameVal,
      email: emailVal,
      userId: user.uid,
      friends: [],
      sendrequest: [],
      friendRequest: [] // CamelCase jesa aapne pehle dikhaya
    });

    alert("Firestore Data Saved!"); // Doosra check
    
    window.location.replace("dashboard.html");

  } catch (error) {
    console.error("Error Detail:", error);
    alert("Error Aya Hai: " + error.message);
  }
};