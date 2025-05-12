// Import the functions you need from the SDKs you need
import { initializeApp,getApp,getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC20r5owE5uccAhcYhy-k1E3LKumXXKOg4",
  authDomain: "ai-interview-15af4.firebaseapp.com",
  projectId: "ai-interview-15af4",
  storageBucket: "ai-interview-15af4.firebasestorage.app",
  messagingSenderId: "664797211158",
  appId: "1:664797211158:web:0ae65a717632462bcae337",
  measurementId: "G-BGX2885032"
};

// Initialize Firebase
const app = !getApps.length?initializeApp(firebaseConfig):getApp();
export const auth=getAuth(app);
export const db=getFirestore(app)
