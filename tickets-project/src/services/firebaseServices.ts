import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { environment } from '../environments/environment';

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

// Obtener todos los documentos
export const getData = async () => {
  const querySnapshot = await getDocs(collection(db, "medicos"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Agregar nuevo documento
export const addData = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, "medicos"), data);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding document: ", error);
    return { success: false, error };
  }
};

// Actualizar documento
export const updateData = async (id: string, data: any) => {
  try {
    await updateDoc(doc(db, "medicos", id), data);
    return { success: true };
  } catch (error) {
    console.error("Error updating document: ", error);
    return { success: false, error };
  }
};

// Eliminar documento
export const deleteData = async (id: string) => {
  try {
    await deleteDoc(doc(db, "medicos", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting document: ", error);
    return { success: false, error };
  }
};