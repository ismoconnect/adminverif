
import fs from "fs";
import path from "path";

const OLD_PROJECT = 'myverif-67454';
const NEW_PROJECT = 'adminmyverif';

const collections = [
  'coupon_submissions',
  'contact_messages',
  'refund_requests',
  'admins'
];

// Helper pour Firestore REST -> JSON
function fromFirestore(fields) {
    const cleaned = {};
    for (const [key, value] of Object.entries(fields || {})) {
        if (value.stringValue !== undefined) cleaned[key] = value.stringValue;
        else if (value.integerValue !== undefined) cleaned[key] = parseInt(value.integerValue);
        else if (value.doubleValue !== undefined) cleaned[key] = parseFloat(value.doubleValue);
        else if (value.booleanValue !== undefined) cleaned[key] = value.booleanValue;
        else if (value.timestampValue !== undefined) cleaned[key] = value.timestampValue;
        else if (value.arrayValue !== undefined) {
            cleaned[key] = (value.arrayValue.values || []).map(v => v.stringValue || v);
        }
        else if (value.mapValue !== undefined) cleaned[key] = fromFirestore(value.mapValue.fields);
        else cleaned[key] = value;
    }
    return cleaned;
}

// Helper pour JSON -> Firestore REST
function toFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val && typeof val === 'object') {
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(v => toFirestoreValue(v)) } };
    }
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

async function migrate() {
    console.log(`MIGRATION de ${OLD_PROJECT} vers ${NEW_PROJECT}...`);
    
    for (const col of collections) {
        console.log(`Traitement de ${col}...`);
        
        // 1. Export
        const exportRes = await fetch(`https://firestore.googleapis.com/v1/projects/${OLD_PROJECT}/databases/(default)/documents/${col}?pageSize=1000`);
        const exportData = await exportRes.json();
        
        if (!exportData.documents) {
            console.log(`  - Collection ${col} vide.`);
            continue;
        }
        
        console.log(`  - ${exportData.documents.length} documents trouvés.`);
        
        // 2. Import
        for (const doc of exportData.documents) {
            const id = doc.name.split('/').pop();
            const url = `https://firestore.googleapis.com/v1/projects/${NEW_PROJECT}/databases/(default)/documents/${col}?documentId=${id}`;
            const updateUrl = `https://firestore.googleapis.com/v1/projects/${NEW_PROJECT}/databases/(default)/documents/${col}/${id}`;
            
            try {
                // Essayer de créer (POST)
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: doc.fields })
                });
                
                if (!res.ok) {
                    // Si déjà là ou erreur, essayer de mettre à jour (PATCH)
                    await fetch(updateUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fields: doc.fields })
                    });
                }
            } catch (err) {
                console.error(`  - Erreur doc ${id}:`, err.message);
            }
        }
        console.log(`  ✓ Collection ${col} migrée.`);
    }
    console.log("\nMIGRATION TERMINÉE AVEC SUCCÈS !");
}

migrate();
