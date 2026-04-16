import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig, firebaseSecondaryConfig } from '../config/firebase.js'

// Initialiser l'application primaire (Nouveau Backend par défaut)
const primaryApp = getApps().length === 0 
  ? initializeApp(firebaseConfig, 'primary') 
  : getApp('primary');

// Initialiser l'application secondaire (Ancien Backend)
const secondaryApp = getApps().find(app => app.name === 'secondary')
  ? getApp('secondary')
  : initializeApp(firebaseSecondaryConfig, 'secondary');

// Exporter les deux bases de données pour la duplication
export const dbPrimary = getFirestore(primaryApp)
export const dbSecondary = getFirestore(secondaryApp)

// Déterminer quelle base de données utiliser pour la VUE uniquement
// Par défaut: Primary. Peut être changé via localStorage.
const isSecondaryView = typeof window !== 'undefined' && localStorage.getItem('firebase_backend_view') === 'secondary';

// L'export 'db' par défaut est celui utilisé par les composants pour l'affichage
export const db = isSecondaryView ? dbSecondary : dbPrimary

// Indicateur pour savoir quel backend on regarde
export const currentBackend = isSecondaryView ? 'secondary' : 'primary'

/**
 * Fonction pour changer de backend de vue
 * @param {'primary'|'secondary'} type 
 */
export const switchBackendView = (type) => {
  localStorage.setItem('firebase_backend_view', type);
  window.location.reload();
}
