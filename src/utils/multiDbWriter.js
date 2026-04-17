import { 
  addDoc as firestoreAddDoc, 
  updateDoc as firestoreUpdateDoc, 
  deleteDoc as firestoreDeleteDoc,
  doc as firestoreDoc,
  collection as firestoreCollection
} from 'firebase/firestore'
import { db } from '../lib/firebase'

/**
 * Exécute une opération d'écriture (anciennement DualWrite)
 */
const executeWrite = async (operationName, ...args) => {
  if (operationName === 'addDoc') {
    return await firestoreAddDoc(firestoreCollection(db, args[0]), args[1]);
  }
  
  if (operationName === 'updateDoc') {
    const docRef = firestoreDoc(db, args[0], args[1]);
    return await firestoreUpdateDoc(docRef, args[2]);
  }
  
  if (operationName === 'deleteDoc') {
    const docRef = firestoreDoc(db, args[0], args[1]);
    return await firestoreDeleteDoc(docRef);
  }
}

/**
 * Fonctions d'écriture standard (noms conservés pour compatibilité avec les imports)
 */
export const dualAddDoc = (colPath, data) => executeWrite('addDoc', colPath, data);
export const dualUpdateDoc = (colPath, docId, data) => executeWrite('updateDoc', colPath, docId, data);
export const dualDeleteDoc = (colPath, docId) => executeWrite('deleteDoc', colPath, docId);
