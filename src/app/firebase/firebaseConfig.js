// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  apiKey: "AIzaSyD41kFhdwwpl6afpYSEFktqyjmbz5lfD-M",
  authDomain: "personalhub-40ebe.firebaseapp.com",
  projectId: "personalhub-40ebe",
  storageBucket: "personalhub-40ebe.firebasestorage.app",
  messagingSenderId: "242229702218",
  appId: "1:242229702218:web:dbe2ddb878b2bc2117c0b3",
  measurementId: "G-07J7CW6BQ7",
};
console.log(firebaseConfig);
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
