import admin from 'firebase-admin';
import serviceAccount from '../../../FirebaseAdminSDKCredentials/serviceAccountKey.json' assert { type: 'json' };
//import serviceAccount from '/etc/secrets/serviceAccountKey.json' assert { type: 'json' };


// Tipar explicitamente o objeto de credenciais
const serviceAccountKey = serviceAccount as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

const db = admin.firestore();
export { db };

export default admin;