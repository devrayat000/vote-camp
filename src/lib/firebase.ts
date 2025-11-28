import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWIAXSu4LaZsEQBEfQSg2MZ7G7szWsGm4",
  authDomain: "election-campaign-479605.firebaseapp.com",
  projectId: "election-campaign-479605",
  storageBucket: "election-campaign-479605.firebasestorage.app",
  messagingSenderId: "1005039134232",
  appId: "1:1005039134232:web:d61bf7ae1225470e21056d",
  measurementId: "G-4NX2W8QN9D",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
