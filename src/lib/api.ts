import { db, ensureInitialized } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import type { CampaignArea, Constituency, Ward, MarkerStatus } from "./types";

// --- Constituencies & Wards (Real Firestore Data) ---

export const getConstituencies = async (): Promise<Constituency[]> => {
  try {
    await ensureInitialized();
    const snapshot = await getDocs(collection(db, "constituencies"));
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        geometry:
          typeof data.geometry === "string"
            ? JSON.parse(data.geometry)
            : data.geometry,
      } as Constituency;
    });
  } catch (e) {
    console.error("Error fetching constituencies:", e);
    return [];
  }
};

export const getConstituencyById = async (
  id: string
): Promise<Constituency | undefined> => {
  try {
    await ensureInitialized();
    const docRef = doc(db, "constituencies", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        id: snapshot.id,
        ...data,
        geometry:
          typeof data.geometry === "string"
            ? JSON.parse(data.geometry)
            : data.geometry,
      } as Constituency;
    }
    return undefined;
  } catch (e) {
    console.error("Error fetching constituency:", e);
    return undefined;
  }
};

export const getWardsByConstituency = async (
  constituencyId: string
): Promise<Ward[]> => {
  try {
    await ensureInitialized();
    const q = query(
      collection(db, "wards"),
      where("constituencyId", "==", constituencyId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        geometry:
          typeof data.geometry === "string"
            ? JSON.parse(data.geometry)
            : data.geometry,
      } as Ward;
    });
  } catch (e) {
    console.error("Error fetching wards:", e);
    return [];
  }
};

// --- Areas (Real-time Firestore) ---

export const subscribeToAreas = (
  constituencyId: string,
  onUpdate: (areas: CampaignArea[]) => void
) => {
  try {
    const q = query(
      collection(db, "campaign_areas"),
      where("constituencyId", "==", constituencyId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const areas = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CampaignArea[];
        onUpdate(areas);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        // Fallback to empty or local state if needed
        onUpdate([]);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error("Error setting up subscription (likely missing config):", e);
    return () => {};
  }
};

export const addArea = async (area: Omit<CampaignArea, "id" | "createdAt">) => {
  try {
    await ensureInitialized();
    await addDoc(collection(db, "campaign_areas"), {
      ...area,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error adding area:", e);
    alert("Could not save area. Check Firebase config.");
  }
};

export const updateAreaStatus = async (
  areaId: string,
  status: MarkerStatus,
  notes?: string
) => {
  try {
    await ensureInitialized();
    const ref = doc(db, "campaign_areas", areaId);
    await updateDoc(ref, { status, notes });
  } catch (e) {
    console.error("Error updating area:", e);
  }
};
