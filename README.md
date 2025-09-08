# Admin App - Gestion des Coupons

Application d'administration pour gérer les soumissions de coupons.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour la production
npm run build
```

## 📋 Fonctionnalités

### Dashboard
- Vue d'ensemble des statistiques
- Soumissions récentes
- Métriques en temps réel

### Gestion des Soumissions
- Liste de toutes les soumissions
- Filtrage par statut et recherche
- Mise à jour des statuts
- Détails complets de chaque soumission
- Marquage des emails comme envoyés

### Statistiques
- Graphiques des soumissions par jour/heure
- Répartition par type de coupon
- Métriques de performance
- Taux de traitement et rejet

## 🔧 Configuration

L'application utilise les mêmes variables d'environnement Firebase que l'app client :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📊 Structure des Données

### Collection: `coupon_submissions`

```javascript
{
  // Informations de base
  type: "Transcash",
  status: "pending", // pending, processing, completed, rejected
  
  // Informations personnelles
  civility: "Monsieur",
  lastName: "Dupont",
  firstName: "Jean",
  fullName: "Monsieur Jean Dupont",
  
  // Contact
  email: "jean@example.com",
  phone: "+33123456789",
  country: "France",
  
  // Configuration
  numCoupons: 2,
  hideCodes: false,
  
  // Codes des coupons
  coupons: [
    {
      id: 1,
      code: "ABC123",
      amount: 50,
      status: "pending"
    }
  ],
  
  // Métadonnées
  createdAt: timestamp,
  updatedAt: timestamp,
  userAgent: "Mozilla/5.0...",
  
  // Statistiques
  totalAmount: 100,
  
  // Suivi
  processingStartedAt: null,
  processingCompletedAt: null,
  emailSent: false,
  emailSentAt: null,
  
  // Notes
  internalNotes: "",
  adminNotes: ""
}
```

## 🎯 Workflow de Traitement

1. **Soumission** → Statut: `pending`
2. **Traitement** → Statut: `processing`
3. **Finalisation** → Statut: `completed` ou `rejected`
4. **Email** → `emailSent: true`

## 🔒 Sécurité

- Accès admin uniquement
- Validation des données côté client et serveur
- Logs des actions administrateur

## 📱 Responsive

L'interface s'adapte automatiquement aux écrans mobiles et desktop.

## 🚀 Déploiement

L'app admin peut être déployée séparément de l'app client sur Vercel, Netlify, ou tout autre hébergeur.
