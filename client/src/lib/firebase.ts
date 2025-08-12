import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDjWblyCRiSnaM_0O9VwGxCURdYmbljWkw",
  authDomain: "geosnapattend.firebaseapp.com",
  projectId: "geosnapattend",
  storageBucket: "geosnapattend.appspot.com",
  messagingSenderId: "523043404389",
  appId: "1:523043404389:web:geosnapattend"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Initialize Cloud Firestore and get a reference to the service
export const firestore = getFirestore(app);

export default app;