import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from '../config/firebase.js'

// Initialiser l'application
const app = initializeApp(firebaseConfig);

// Exporter la base de données
export const db = getFirestore(app);
