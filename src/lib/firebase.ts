import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "@/lib/firebase-config";

let firebaseApp: FirebaseApp | undefined;

export function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase services are only available in the browser.");
  }
  if (!firebaseApp) {
    if (!firebaseConfig.apiKey) {
      throw new Error(
        "Firebase API key is missing. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local and rebuild."
      );
    }
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}
