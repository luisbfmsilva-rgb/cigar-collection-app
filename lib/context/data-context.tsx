import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export interface Humidor {
  id: string;
  name: string;
  capacity: number;
  type: "box" | "humidor" | "drawer" | "other";
  cigarsCount: number;
  createdAt: string;
}

export interface Cigar {
  id: string;
  brand: string;
  name: string;
  vitola: string;
  ringGauge: number;
  length: number;
  country: string;
  wrapper?: string;
  binder?: string;
  filler?: string;
  purchaseDate: string;
  purchasePrice: number;
  purchaseLocation?: string;
  humidorId: string;
  quantity: number;
  photoUri?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  cigarId: string;
  tastingDate: string;
  preLight: number; // 1-5
  smoke: number; // 1-5
  flavour: number; // 1-5
  burn: number; // 1-5
  enjoyment: number; // 1-5
  flavorsIdentified: string[];
  intensity: "suave" | "médio" | "forte";
  comments: string;
  photoUri?: string;
  smokingTime?: number;
  finalScore: number; // 0-100 (calculated)
  createdAt: string;
}

interface DataContextType {
  humidors: Humidor[];
  cigars: Cigar[];
  reviews: Review[];
  addHumidor: (humidor: Omit<Humidor, "id" | "cigarsCount" | "createdAt">) => Promise<void>;
  updateHumidor: (id: string, humidor: Partial<Humidor>) => Promise<void>;
  deleteHumidor: (id: string) => Promise<void>;
  addCigar: (cigar: Omit<Cigar, "id" | "createdAt">) => Promise<void>;
  updateCigar: (id: string, cigar: Partial<Cigar>) => Promise<void>;
  deleteCigar: (id: string) => Promise<void>;
  addReview: (review: Omit<Review, "id" | "createdAt" | "finalScore">) => Promise<void>;
  updateReview: (id: string, review: Partial<Review>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [humidors, setHumidors] = useState<Humidor[]>([]);
  const [cigars, setCigars] = useState<Cigar[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [humidorsData, cigarsData, reviewsData] = await Promise.all([
        AsyncStorage.getItem("humidors"),
        AsyncStorage.getItem("cigars"),
        AsyncStorage.getItem("reviews"),
      ]);

      if (humidorsData) setHumidors(JSON.parse(humidorsData));
      if (cigarsData) setCigars(JSON.parse(cigarsData));
      if (reviewsData) setReviews(JSON.parse(reviewsData));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHumidors = async (data: Humidor[]) => {
    try {
      await AsyncStorage.setItem("humidors", JSON.stringify(data));
      setHumidors(data);
    } catch (error) {
      console.error("Error saving humidors:", error);
    }
  };

  const saveCigars = async (data: Cigar[]) => {
    try {
      await AsyncStorage.setItem("cigars", JSON.stringify(data));
      setCigars(data);
    } catch (error) {
      console.error("Error saving cigars:", error);
    }
  };

  const saveReviews = async (data: Review[]) => {
    try {
      await AsyncStorage.setItem("reviews", JSON.stringify(data));
      setReviews(data);
    } catch (error) {
      console.error("Error saving reviews:", error);
    }
  };

  const addHumidor = async (humidor: Omit<Humidor, "id" | "cigarsCount" | "createdAt">) => {
    const newHumidor: Humidor = {
      ...humidor,
      id: Date.now().toString(),
      cigarsCount: 0,
      createdAt: new Date().toISOString(),
    };
    await saveHumidors([...humidors, newHumidor]);
  };

  const updateHumidor = async (id: string, updates: Partial<Humidor>) => {
    const updated = humidors.map((h) => (h.id === id ? { ...h, ...updates } : h));
    await saveHumidors(updated);
  };

  const deleteHumidor = async (id: string) => {
    const filtered = humidors.filter((h) => h.id !== id);
    await saveHumidors(filtered);
    // Also delete cigars in this humidor
    const cigarsInHumidor = cigars.filter((c) => c.humidorId === id);
    const newCigars = cigars.filter((c) => c.humidorId !== id);
    await saveCigars(newCigars);
  };

  const addCigar = async (cigar: Omit<Cigar, "id" | "createdAt">) => {
    const newCigar: Cigar = {
      ...cigar,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const newCigars = [...cigars, newCigar];
    await saveCigars(newCigars);

    // Update humidor cigar count
    const humidorIndex = humidors.findIndex((h) => h.id === cigar.humidorId);
    if (humidorIndex >= 0) {
      const updated = [...humidors];
      updated[humidorIndex].cigarsCount += cigar.quantity;
      await saveHumidors(updated);
    }
  };

  const updateCigar = async (id: string, updates: Partial<Cigar>) => {
    const cigarIndex = cigars.findIndex((c) => c.id === id);
    if (cigarIndex >= 0) {
      const oldCigar = cigars[cigarIndex];
      const updated = cigars.map((c) => (c.id === id ? { ...c, ...updates } : c));
      await saveCigars(updated);

      // Update humidor counts if quantity changed
      if (updates.quantity && updates.quantity !== oldCigar.quantity) {
        const diff = updates.quantity - oldCigar.quantity;
        const humidorIndex = humidors.findIndex((h) => h.id === oldCigar.humidorId);
        if (humidorIndex >= 0) {
          const updatedHumidors = [...humidors];
          updatedHumidors[humidorIndex].cigarsCount += diff;
          await saveHumidors(updatedHumidors);
        }
      }
    }
  };

  const deleteCigar = async (id: string) => {
    const cigar = cigars.find((c) => c.id === id);
    const filtered = cigars.filter((c) => c.id !== id);
    await saveCigars(filtered);

    // Update humidor cigar count
    if (cigar) {
      const humidorIndex = humidors.findIndex((h) => h.id === cigar.humidorId);
      if (humidorIndex >= 0) {
        const updated = [...humidors];
        updated[humidorIndex].cigarsCount -= cigar.quantity;
        await saveHumidors(updated);
      }
    }
  };

  const addReview = async (review: Omit<Review, "id" | "createdAt" | "finalScore">) => {
    const finalScore = Math.round(
      ((review.preLight + review.smoke + review.flavour + review.burn + review.enjoyment) / 5) * 20
    );

    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      finalScore,
      createdAt: new Date().toISOString(),
    };
    await saveReviews([...reviews, newReview]);
  };

  const updateReview = async (id: string, updates: Partial<Review>) => {
    const updated = reviews.map((r) => {
      if (r.id === id) {
        const newReview = { ...r, ...updates };
        if (updates.preLight || updates.smoke || updates.flavour || updates.burn || updates.enjoyment) {
          newReview.finalScore = Math.round(
            ((newReview.preLight + newReview.smoke + newReview.flavour + newReview.burn + newReview.enjoyment) / 5) * 20
          );
        }
        return newReview;
      }
      return r;
    });
    await saveReviews(updated);
  };

  const deleteReview = async (id: string) => {
    const filtered = reviews.filter((r) => r.id !== id);
    await saveReviews(filtered);
  };

  return (
    <DataContext.Provider
      value={{
        humidors,
        cigars,
        reviews,
        addHumidor,
        updateHumidor,
        deleteHumidor,
        addCigar,
        updateCigar,
        deleteCigar,
        addReview,
        updateReview,
        deleteReview,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
