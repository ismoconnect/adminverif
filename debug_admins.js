
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^\"|\"$/g, '');
});

const primaryConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

async function checkAdmins() {
  try {
    const app = initializeApp(primaryConfig);
    const db = getFirestore(app);
    const snap = await getDocs(collection(db, 'admins'));
    console.log(`Documents dans 'admins' pour ${primaryConfig.projectId}:`);
    if (snap.empty) {
        console.log('Collection VIDE !');
    }
    snap.forEach(doc => {
      console.log(`- ID: ${doc.id}`);
      console.log(`  Data:`, doc.data());
    });
  } catch (e) {
    console.error('Erreur:', e.message);
  }
}

checkAdmins();
