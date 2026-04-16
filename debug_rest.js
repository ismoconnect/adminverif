
async function checkAdmins() {
  const PROJECT_ID = 'adminmyverif';
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('--- DB: adminmyverif ---');
    if (!data.documents) {
        console.log('VIDE ! Aucun document.');
        return;
    }
    data.documents.forEach(doc => {
        const fields = doc.fields || {};
        console.log(`ID: ${doc.name.split('/').pop()}`);
        console.log(`Username: ${fields.username?.stringValue}`);
        console.log(`Email: ${fields.email?.stringValue}`);
    });
  } catch (e) {
    console.error(e);
  }
}

checkAdmins();
