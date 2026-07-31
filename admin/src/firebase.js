// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDfjfpXJidA-7kOfSk5rZk5rPgSPSUVPfg",
    authDomain: "dealora-d8a89.firebaseapp.com",
    projectId: "dealora-d8a89",
    storageBucket:"dealora-d8a89.firebasestorage.app",
    messagingSenderId: "1050020690215",
    appId: "1:1050020690215:web:b409f1b4efcad199e9d102",
    FIREBASE_STORAGE_BUCKET:"dealora-d8a89.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app); 