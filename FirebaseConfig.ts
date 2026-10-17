// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth } from 'firebase/auth';
//@ts-ignore
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAn-IungvkGAEHbw9tL5fgWsx1iHU4oKvI",
  authDomain: "geocycle-e75d1.firebaseapp.com",
  projectId: "geocycle-e75d1",
  storageBucket: "geocycle-e75d1.firebasestorage.app",
  messagingSenderId: "908993058094",
  appId: "1:908993058094:web:6a71d1d5477915405c56bf"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});