import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyD9unLbCBKBnGsX3zv8--Hi0gY_hFj6EQQ",
  authDomain: "habit-tracker-dcc05.firebaseapp.com",
  projectId: "habit-tracker-dcc05",
  storageBucket: "habit-tracker-dcc05.firebasestorage.app",
  messagingSenderId: "1090589002",
  appId: "1:1090589002:web:71a06c14d1f23ec19f71b3"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Force account selection every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
