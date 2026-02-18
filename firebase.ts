
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// NOTE: You should replace these with your actual Firebase project config from the Firebase Console.
// For demonstration, these are placeholders.
const firebaseConfig = {
  apiKey: "AIzaSyAs-Placeholder-Key",
  authDomain: "ramadan-habit-tracker.firebaseapp.com",
  projectId: "ramadan-habit-tracker-demo",
  storageBucket: "ramadan-habit-tracker-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
