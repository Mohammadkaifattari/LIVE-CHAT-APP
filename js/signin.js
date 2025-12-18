import { getAuth, signInWithEmailAndPassword,onAuthStateChanged } from "./config.js";

const auth = getAuth();

window.signin = (event) => {
  event.preventDefault()

//   const Name = document.getElementById("signupName")
    const email = document.getElementById("loginEmail")
    const password = document.getElementById("loginPassword")

  

signInWithEmailAndPassword(auth, email.value, password.value)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
      event.reset()
   
    console.log("user signup hogya he")
      setTimeout(() => {
                window.location.replace("dashboard.html")
                
            },5000);

    
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
  });
}

function getUser() {
  onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    const uid = user.uid;
    console.log("ye user signup he" +user)
     console.log("user mojood hai" , uid)
            setTimeout(() => {
                window.location.replace("dashboard.html")
                
            },5000);
    // ...
  } else {
    // User is signed out
    // ...
      console.log("user mojood nahi hai" , )
  }
});

  
}
getUser()