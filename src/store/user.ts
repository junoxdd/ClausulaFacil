import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

export interface UserProfile {
  userId: string;
  plan: "free" | "pro" | "unlimited";
  analysesCount: number;
  autoDeleteDays?: number; // 0 means disabled
}

export async function getUserProfile(): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  try {
    const docRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    } else {
      const newProfile: UserProfile = {
        userId: user.uid,
        plan: "free",
        analysesCount: 0,
        autoDeleteDays: 0
      };
      await setDoc(docRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    throw error;
  }
}

export async function incrementAnalysesCount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
      analysesCount: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    throw error;
  }
}

export async function updateAutoDeleteSetting(days: number): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
      autoDeleteDays: days
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    throw error;
  }
}
