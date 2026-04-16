
async function checkOldAdmins() {
  const PROJECT_ID = 'myverif-67454';
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`--- DB: ${PROJECT_ID} ---`);
    if (!data.documents) {
        console.log('VIDE !');
        return;
    }
    data.documents.forEach(doc => {
        const fields = doc.fields || {};
        console.log(`ID: ${doc.name.split('/').pop()}`);
        console.log(`Username: ${fields.username?.stringValue}`);
    });
  } catch (e) {
    console.error(e);
  }
}

checkOldAdmins();
