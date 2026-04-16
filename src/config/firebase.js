// Configuration pour le projet Principal (Nouveau)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Configuration pour le projet Secondaire (Ancien)
export const firebaseSecondaryConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_OLD_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_OLD_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_OLD_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_OLD_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_OLD_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_OLD_APP_ID,
}
