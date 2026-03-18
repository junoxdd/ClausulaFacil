import { ContractAnalysis } from "../services/gemini";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { getUserProfile } from "./user";

export interface ContractRecord {
  id: string;
  userId: string;
  date: string;
  title: string;
  text: string;
  analysis: ContractAnalysis;
  folder?: string;
  tags?: string[];
  status?: "Em Negociação" | "Assinado" | "Cancelado" | "Revisão Pendente";
}

export async function getHistory(): Promise<ContractRecord[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const profile = await getUserProfile();
    const autoDeleteDays = profile?.autoDeleteDays || 0;

    const q = query(
      collection(db, "contracts"),
      where("userId", "==", user.uid)
    );
    const snapshot = await getDocs(q);
    let records = snapshot.docs.map(doc => doc.data() as ContractRecord);

    // Handle auto-deletion
    if (autoDeleteDays > 0) {
      const now = new Date().getTime();
      const msInDay = 24 * 60 * 60 * 1000;
      
      const recordsToDelete = records.filter(record => {
        const recordDate = new Date(record.date).getTime();
        const daysOld = (now - recordDate) / msInDay;
        return daysOld > autoDeleteDays;
      });

      if (recordsToDelete.length > 0) {
        await Promise.all(recordsToDelete.map(record => deleteDoc(doc(db, "contracts", record.id))));
        records = records.filter(record => !recordsToDelete.includes(record));
      }
    }

    // Sort by date descending
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "contracts");
    return [];
  }
}

export async function saveContract(record: ContractRecord): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, "contracts", record.id);
    await setDoc(docRef, record);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `contracts/${record.id}`);
    throw error;
  }
}

export async function updateContract(id: string, updates: Partial<ContractRecord>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, "contracts", id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contracts/${id}`);
    throw error;
  }
}

export async function getContract(id: string): Promise<ContractRecord | undefined> {
  const user = auth.currentUser;
  if (!user) return undefined;

  try {
    const docRef = doc(db, "contracts", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as ContractRecord;
    }
    return undefined;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `contracts/${id}`);
    return undefined;
  }
}

export async function deleteContract(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, "contracts", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `contracts/${id}`);
    throw error;
  }
}
