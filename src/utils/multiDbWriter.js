import { 
  addDoc as firestoreAddDoc, 
  updateDoc as firestoreUpdateDoc, 
  deleteDoc as firestoreDeleteDoc,
  doc as firestoreDoc,
  collection as firestoreCollection
} from 'firebase/firestore'
import { dbPrimary, dbSecondary } from '../lib/firebase'

/**
 * Exécute une opération d'écriture sur les deux backends (Duplication)
 * @param {Function} operation - L'opération Firestore à exécuter
 */
const executeDualWrite = async (operationName, ...args) => {
  // 1. Exécuter sur le backend Primaire (Nouveau) - Obligatoire
  const primaryResult = await executeOnDb(dbPrimary, operationName, ...args);
  
  // 2. Exécuter sur le backend Secondaire (Ancien) - Silencieux (ne bloque pas si échec)
  try {
    await executeOnDb(dbSecondary, operationName, ...args);
  } catch (secondaryError) {
    console.warn(`[DualWrite] Échec de la duplication sur le backend secondaire pour ${operationName}:`, secondaryError);
  }

  return primaryResult;
}

// Fonction utilitaire pour mapper les arguments vers la bonne instance db
async function executeOnDb(targetDb, operationName, colPath, dataOrId, dataForUpdate) {
  if (operationName === 'addDoc') {
    return await firestoreAddDoc(firestoreCollection(targetDb, colPath), dataOrId);
  }
  
  if (operationName === 'updateDoc') {
    const docRef = firestoreDoc(targetDb, colPath, dataOrId);
    return await firestoreUpdateDoc(docRef, dataForUpdate);
  }
  
  if (operationName === 'deleteDoc') {
    const docRef = firestoreDoc(targetDb, colPath, dataOrId);
    return await firestoreDeleteDoc(docRef);
  }
}

/**
 * Version "Dual" des fonctions Firestore standard
 */
export const dualAddDoc = (colPath, data) => executeDualWrite('addDoc', colPath, data);
export const dualUpdateDoc = (colPath, docId, data) => executeDualWrite('updateDoc', colPath, docId, data);
export const dualDeleteDoc = (colPath, docId) => executeDualWrite('deleteDoc', colPath, docId);
