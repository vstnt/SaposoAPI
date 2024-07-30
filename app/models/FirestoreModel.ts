/*Camada de abstração do firestore, que simula um comportamento semelhante aos models
 usados anteriormente pela db PostgreSQL */


import { db } from "#start/firebaseAdmin";

class FirestoreModel {
  collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async findAll() {
    const snapshot = await db.collection(this.collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findById(id: string) {
    const doc = await db.collection(this.collectionName).doc(id).get();
    return { id: doc.id, ...doc.data() };
  }

  async create(data: any) {
    const docRef = await db.collection(this.collectionName).add(data);
    return { id: docRef.id, ...data };
  }

  async update(id: string, data: any) {
    await db.collection(this.collectionName).doc(id).update(data);
    const doc = await db.collection(this.collectionName).doc(id).get();
    return { id: doc.id, ...doc.data() };
  }

  async delete(id: string) {
    await db.collection(this.collectionName).doc(id).delete();
  }
}

export default FirestoreModel;