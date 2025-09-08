import { db } from '../lib/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'

// Collection pour les administrateurs
const ADMIN_COLLECTION = 'admins'

// Fonction pour vérifier les identifiants admin
export const authenticateAdmin = async (username, password) => {
  try {
    // Rechercher l'admin par nom d'utilisateur
    const adminQuery = query(
      collection(db, ADMIN_COLLECTION),
      where('username', '==', username),
      where('isActive', '==', true)
    )
    
    const querySnapshot = await getDocs(adminQuery)
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' }
    }
    
    const adminDoc = querySnapshot.docs[0]
    const adminData = adminDoc.data()
    
    // Vérifier le mot de passe (en production, utilisez un hash)
    if (adminData.password !== password) {
      return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' }
    }
    
    // Mettre à jour la dernière connexion
    await updateDoc(doc(db, ADMIN_COLLECTION, adminDoc.id), {
      lastLogin: serverTimestamp(),
      loginCount: (adminData.loginCount || 0) + 1
    })
    
    // Retourner les données admin (sans le mot de passe)
    const { password: _, ...adminWithoutPassword } = adminData
    
    return {
      success: true,
      admin: {
        id: adminDoc.id,
        ...adminWithoutPassword
      }
    }
  } catch (error) {
    console.error('Erreur d\'authentification admin:', error)
    return { success: false, error: 'Erreur de connexion au serveur' }
  }
}

// Fonction pour créer un nouvel admin
export const createAdmin = async (adminData) => {
  try {
    const docRef = await addDoc(collection(db, ADMIN_COLLECTION), {
      ...adminData,
      createdAt: serverTimestamp(),
      isActive: true,
      loginCount: 0
    })
    
    return { success: true, adminId: docRef.id }
  } catch (error) {
    console.error('Erreur création admin:', error)
    return { success: false, error: 'Erreur lors de la création de l\'admin' }
  }
}

// Fonction pour récupérer tous les admins
export const getAllAdmins = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, ADMIN_COLLECTION))
    const admins = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return { success: true, admins }
  } catch (error) {
    console.error('Erreur récupération admins:', error)
    return { success: false, error: 'Erreur lors de la récupération des admins' }
  }
}

// Fonction pour désactiver un admin
export const deactivateAdmin = async (adminId) => {
  try {
    await updateDoc(doc(db, ADMIN_COLLECTION, adminId), {
      isActive: false,
      deactivatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Erreur désactivation admin:', error)
    return { success: false, error: 'Erreur lors de la désactivation de l\'admin' }
  }
}

// Fonction pour changer le mot de passe d'un admin
export const changeAdminPassword = async (adminId, newPassword) => {
  try {
    await updateDoc(doc(db, ADMIN_COLLECTION, adminId), {
      password: newPassword,
      passwordChangedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Erreur changement mot de passe:', error)
    return { success: false, error: 'Erreur lors du changement de mot de passe' }
  }
}

// Fonction pour vérifier si une session admin est valide
export const validateAdminSession = async (adminId) => {
  try {
    const adminDoc = await getDoc(doc(db, ADMIN_COLLECTION, adminId))
    
    if (!adminDoc.exists()) {
      return { success: false, error: 'Admin introuvable' }
    }
    
    const adminData = adminDoc.data()
    
    if (!adminData.isActive) {
      return { success: false, error: 'Compte admin désactivé' }
    }
    
    return { success: true, admin: { id: adminDoc.id, ...adminData } }
  } catch (error) {
    console.error('Erreur validation session:', error)
    return { success: false, error: 'Erreur de validation de session' }
  }
}
