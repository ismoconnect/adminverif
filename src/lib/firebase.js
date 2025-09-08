import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from '../config/firebase.js'

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
