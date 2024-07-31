import admin from 'firebase-admin';
//import serviceAccount from '../../../FirebaseAdminSDKCredentials/serviceAccountKey.json' assert { type: 'json' };
import serviceAccount from '/etc/secrets/serviceAccountKey.json' assert { type: 'json' };
//usei o comando: git update-index --assume-unchanged start/firebaseAdmin.ts
// pra que o git pare de rastrear alterações nesse arquivo feitas nesse repositório local. Para voltar a rastrear, basta:
// git update-index --no-assume-unchanged start/firebaseAdmin.ts
// da pra fazer o mesmo pra pastas, mas nesse caso precisa deixar elas tbm no gitignore antes


// Tipar explicitamente o objeto de credenciais
const serviceAccountKey = serviceAccount as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

const db = admin.firestore();
export { db };

export default admin;