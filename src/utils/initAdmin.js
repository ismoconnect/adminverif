import { createAdmin } from '../services/adminAuthService'

// Script pour créer le premier administrateur
export const initializeFirstAdmin = async () => {
  const adminData = {
    username: 'admin',
    password: 'admin123', // À changer en production
    name: 'Administrateur Principal',
    email: 'admin@myverif.com',
    role: 'super_admin',
    permissions: ['read', 'write', 'delete', 'manage_users'],
    isActive: true
  }

  try {
    const result = await createAdmin(adminData)
    
    if (result.success) {
      console.log('✅ Premier administrateur créé avec succès!')
      console.log('📧 Nom d\'utilisateur:', adminData.username)
      console.log('🔑 Mot de passe:', adminData.password)
      console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion!')
      return result
    } else {
      console.error('❌ Erreur lors de la création de l\'admin:', result.error)
      return result
    }
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return { success: false, error: error.message }
  }
}

// Fonction pour créer un admin personnalisé
export const createCustomAdmin = async (username, password, name, email, role = 'admin') => {
  const adminData = {
    username,
    password,
    name,
    email,
    role,
    permissions: role === 'super_admin' 
      ? ['read', 'write', 'delete', 'manage_users'] 
      : ['read', 'write'],
    isActive: true
  }

  try {
    const result = await createAdmin(adminData)
    
    if (result.success) {
      console.log('✅ Administrateur créé avec succès!')
      console.log('👤 Nom:', adminData.name)
      console.log('📧 Email:', adminData.email)
      console.log('🔑 Nom d\'utilisateur:', adminData.username)
      return result
    } else {
      console.error('❌ Erreur lors de la création de l\'admin:', result.error)
      return result
    }
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return { success: false, error: error.message }
  }
}

// Instructions d'utilisation
export const showInstructions = () => {
  console.log(`
🚀 INSTRUCTIONS POUR L'INITIALISATION ADMIN

1. Créer le premier admin:
   import { initializeFirstAdmin } from './utils/initAdmin'
   await initializeFirstAdmin()

2. Créer un admin personnalisé:
   import { createCustomAdmin } from './utils/initAdmin'
   await createCustomAdmin('username', 'password', 'Nom Admin', 'email@example.com')

3. Connexion:
   - URL: /admin/login
   - Nom d'utilisateur: admin
   - Mot de passe: admin123

4. Sécurité:
   - Changez le mot de passe par défaut
   - Créez des utilisateurs avec des rôles appropriés
   - Activez l'authentification à deux facteurs (optionnel)

📋 STRUCTURE FIRESTORE:
Collection: 'admins'
Document: {
  username: string,
  password: string, // À hasher en production
  name: string,
  email: string,
  role: 'admin' | 'super_admin',
  permissions: string[],
  isActive: boolean,
  createdAt: timestamp,
  lastLogin: timestamp,
  loginCount: number
}
  `)
}
