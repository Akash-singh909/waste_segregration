import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE PROJECT KEYS
const firebaseConfig = {
  apiKey: "AIzaSyDW7a9jXydVqOu1DAamCwgL_MPj24yWxTs",
  authDomain: "ecosort-ai-37180.firebaseapp.com",
  projectId: "ecosort-ai-37180",
  storageBucket: "ecosort-ai-37180.firebasestorage.app",
  messagingSenderId: "423442445313",
  appId: "1:423442445313:web:188a5a43d8160567dbbc00",
  measurementId: "G-EJ584EZY5H"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
