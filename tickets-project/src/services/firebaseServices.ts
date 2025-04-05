import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { environment } from '../environments/environment'; 


const app = initializeApp(environment.firebase);
const db = getFirestore(app); 


export const getData = async () => {
  const querySnapshot = await getDocs(collection(db, "medicos"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};