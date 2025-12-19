import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace with YOUR Firebase config from console

const firebaseConfig = {
  apiKey: "AIzaSyD9unLbCBKBnGsX3zv8--Hi0gY_hFj6EQQ",
  authDomain: "habit-tracker-dcc05.firebaseapp.com",
  projectId: "habit-tracker-dcc05",
  storageBucket: "habit-tracker-dcc05.firebasestorage.app",
  messagingSenderId: "1090589002",
  appId: "1:1090589002:web:71a06c14d1f23ec19f71b3"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
