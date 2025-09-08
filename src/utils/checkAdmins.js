import { getAllAdmins } from '../services/adminAuthService'

// Fonction pour vérifier si des admins existent
export const checkIfAdminsExist = async () => {
  try {
    const result = await getAllAdmins()
    
    if (result.success) {
      const activeAdmins = result.admins.filter(admin => admin.isActive)
      return {
        exists: activeAdmins.length > 0,
        count: activeAdmins.length,
        admins: activeAdmins
      }
    } else {
      console.error('Erreur lors de la vérification des admins:', result.error)
      return {
        exists: false,
        count: 0,
        admins: [],
        error: result.error
      }
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la vérification:', error)
    return {
      exists: false,
      count: 0,
      admins: [],
      error: error.message
    }
  }
}

// Fonction pour afficher les informations des admins
export const displayAdminInfo = (adminCheck) => {
  if (adminCheck.error) {
    console.error('❌ Erreur:', adminCheck.error)
    return
  }

  if (adminCheck.exists) {
    console.log(`✅ ${adminCheck.count} administrateur(s) trouvé(s):`)
    adminCheck.admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name} (${admin.username}) - ${admin.role}`)
      console.log(`      Email: ${admin.email}`)
      console.log(`      Dernière connexion: ${admin.lastLogin ? new Date(admin.lastLogin.seconds * 1000).toLocaleString('fr-FR') : 'Jamais'}`)
      console.log(`      Nombre de connexions: ${admin.loginCount || 0}`)
    })
  } else {
    console.log('⚠️  Aucun administrateur trouvé')
    console.log('📝 Pour créer le premier admin, visitez: /admin/init')
  }
}

// Instructions d'utilisation
export const showAdminInstructions = () => {
  console.log(`
🚀 INSTRUCTIONS POUR LA GESTION DES ADMINS

1. Vérifier les admins existants:
   import { checkIfAdminsExist, displayAdminInfo } from './utils/checkAdmins'
   const adminCheck = await checkIfAdminsExist()
   displayAdminInfo(adminCheck)

2. Créer le premier admin:
   - Visitez: /admin/init
   - Remplissez le formulaire
   - Cliquez sur "Créer l'administrateur"

3. Se connecter:
   - Visitez: /admin/login
   - Utilisez les identifiants créés

4. Gérer les admins:
   - Voir tous les admins dans le tableau de bord
   - Désactiver des comptes si nécessaire
   - Changer les mots de passe

📋 STRUCTURE FIRESTORE:
Collection: 'admins'
- username: string (unique)
- password: string (à hasher en production)
- name: string
- email: string
- role: 'admin' | 'super_admin'
- permissions: string[]
- isActive: boolean
- createdAt: timestamp
- lastLogin: timestamp
- loginCount: number
  `)
}
