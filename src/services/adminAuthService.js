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
export const authenticateAdmin = async (usernameOrEmail, password) => {
  try {
    let adminDoc = null
    let adminData = null
    
    // Méthode 1 : Essayer avec une requête sur username
    try {
      const usernameQuery = query(
        collection(db, ADMIN_COLLECTION),
        where('username', '==', usernameOrEmail)
      )
      const usernameSnapshot = await getDocs(usernameQuery)
      
      if (!usernameSnapshot.empty) {
        adminDoc = usernameSnapshot.docs[0]
        adminData = adminDoc.data()
      }
    } catch (usernameError) {
      console.warn('Erreur requête username:', usernameError)
      // Continuer avec la méthode suivante
    }
    
    // Méthode 2 : Si pas trouvé, essayer avec email
    if (!adminDoc) {
      try {
        const emailQuery = query(
          collection(db, ADMIN_COLLECTION),
          where('email', '==', usernameOrEmail)
        )
        const emailSnapshot = await getDocs(emailQuery)
        
        if (!emailSnapshot.empty) {
          adminDoc = emailSnapshot.docs[0]
          adminData = adminDoc.data()
        }
      } catch (emailError) {
        console.warn('Erreur requête email:', emailError)
        // Continuer avec la méthode de fallback
      }
    }
    
    // Méthode 3 : Fallback - récupérer tous les admins et filtrer côté client
    if (!adminDoc) {
      try {
        console.log('Utilisation du fallback: récupération de tous les admins')
        const allAdminsQuery = query(collection(db, ADMIN_COLLECTION))
        const allAdminsSnapshot = await getDocs(allAdminsQuery)
        
        // Chercher manuellement dans les résultats
        for (const doc of allAdminsSnapshot.docs) {
          const data = doc.data()
          if (data.username === usernameOrEmail || data.email === usernameOrEmail) {
            adminDoc = doc
            adminData = data
            break
          }
        }
      } catch (fallbackError) {
        console.error('Erreur fallback récupération admins:', fallbackError)
        return { 
          success: false, 
          error: 'Erreur de connexion au serveur. Veuillez réessayer.' 
        }
      }
    }
    
    if (!adminDoc || !adminData) {
      console.log('Aucun admin trouvé avec le username/email:', usernameOrEmail)
      return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' }
    }
    
    // Vérifier si l'admin est actif
    if (!adminData.isActive) {
      return { 
        success: false, 
        error: 'Votre compte a été désactivé. Contactez un administrateur.' 
      }
    }
    
    // Vérifier le mot de passe (en production, utilisez un hash)
    // Comparaison avec trim pour éviter les problèmes d'espaces
    const storedPassword = String(adminData.password || '').trim()
    const providedPassword = String(password || '').trim()
    
    if (storedPassword !== providedPassword) {
      console.log('Mot de passe incorrect - Longueur stocké:', storedPassword.length, 'Longueur fourni:', providedPassword.length)
      return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' }
    }
    
    // Vérifier si l'admin est autorisé
    // Si isAuthorized est true, autoriser même si status est "pending_authorization"
    if (!adminData.isAuthorized) {
      return { 
        success: false, 
        error: 'Votre compte n\'est pas encore autorisé. Contactez un administrateur.' 
      }
    }
    
    // Mettre à jour la dernière connexion et corriger le statut si nécessaire
    const updateData = {
      lastLogin: serverTimestamp(),
      loginCount: (adminData.loginCount || 0) + 1
    }
    
    // Si isAuthorized est true mais status n'est pas "authorized", corriger le statut
    if (adminData.isAuthorized && adminData.status !== 'authorized') {
      updateData.status = 'authorized'
    }
    
    await updateDoc(doc(db, ADMIN_COLLECTION, adminDoc.id), updateData)
    
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
      isAuthorized: false, // Nouvel admin non autorisé par défaut
      loginCount: 0,
      status: 'pending_authorization' // Statut en attente d'autorisation
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
    
    if (!adminData.isAuthorized) {
      return { success: false, error: 'Compte admin non autorisé' }
    }
    
    return { success: true, admin: { id: adminDoc.id, ...adminData } }
  } catch (error) {
    console.error('Erreur validation session:', error)
    return { success: false, error: 'Erreur de validation de session' }
  }
}

// Fonction pour autoriser un admin
export const authorizeAdmin = async (adminId) => {
  try {
    await updateDoc(doc(db, ADMIN_COLLECTION, adminId), {
      isAuthorized: true,
      status: 'authorized',
      authorizedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Erreur autorisation admin:', error)
    return { success: false, error: 'Erreur lors de l\'autorisation de l\'admin' }
  }
}

// Fonction pour révoquer l'autorisation d'un admin
export const revokeAdminAuthorization = async (adminId) => {
  try {
    await updateDoc(doc(db, ADMIN_COLLECTION, adminId), {
      isAuthorized: false,
      status: 'revoked',
      revokedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Erreur révocation admin:', error)
    return { success: false, error: 'Erreur lors de la révocation de l\'admin' }
  }
}

// Fonction pour récupérer les admins en attente d'autorisation
export const getPendingAdmins = async () => {
  try {
    const adminQuery = query(
      collection(db, ADMIN_COLLECTION),
      where('isAuthorized', '==', false),
      where('isActive', '==', true)
    )
    
    const querySnapshot = await getDocs(adminQuery)
    const admins = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return { success: true, admins }
  } catch (error) {
    console.error('Erreur récupération admins en attente:', error)
    return { success: false, error: 'Erreur lors de la récupération des admins en attente' }
  }
}
