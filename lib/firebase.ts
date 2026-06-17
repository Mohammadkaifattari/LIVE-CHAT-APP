import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEmsA8IMFXCxJlMobeK4AGxDatqsuRDgo",
  authDomain: "my-web-d29b8.firebaseapp.com",
  projectId: "my-web-d29b8",
  storageBucket: "my-web-d29b8.firebasestorage.app",
  messagingSenderId: "766977358332",
  appId: "1:766977358332:web:b04be1ca1bcbb6afad5a79",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;