const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://bloc-notas-bf899-default-rtdb.firebaseio.com/"
    });
}

const db = admin.firestore();
module.exports = { db, admin };
