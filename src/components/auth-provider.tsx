
"use client";

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { collection, doc, setDoc, writeBatch, getDoc } from 'firebase/firestore';

import { ProductStoreProvider } from '@/store/products.tsx';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { INITIAL_PRODUCTS } from '@/lib/constants';
import { subDays } from 'date-fns';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  updateUser: (name: string, picture?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const seedInitialData = async (userId: string) => {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data()?.initialized) {
      return; // Data already seeded
    }

    const productsCollection = collection(firestore, 'users', userId, 'products');
    const salesCollection = collection(firestore, 'users', userId, 'sales');
    const batch = writeBatch(firestore);

    // Set initialized flag
    batch.set(userDocRef, { initialized: true }, { merge: true });

    const productDocs = INITIAL_PRODUCTS.map(product => {
      const newDocRef = doc(productsCollection);
      const productWithId = { ...product, id: newDocRef.id };
      batch.set(newDocRef, productWithId);
      return productWithId;
    });

    // Seed some random sales for the last 7 days
    for (let i = 0; i < 7; i++) {
      const numSales = Math.floor(Math.random() * 3); // 0 to 2 sales per day
      for (let j = 0; j < numSales; j++) {
        const saleDate = subDays(new Date(), i);
        const saleDocRef = doc(salesCollection);
        const numItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 items per sale
        const saleItems = [];
        let saleTotal = 0;
        const usedProductIndices = new Set();

        for (let k = 0; k < numItems; k++) {
          let productIndex = Math.floor(Math.random() * productDocs.length);
          while(usedProductIndices.has(productIndex)) {
            productIndex = Math.floor(Math.random() * productDocs.length);
          }
          usedProductIndices.add(productIndex);

          const product = productDocs[productIndex];
          const quantity = Math.floor(Math.random() * 2) + 1; // 1 to 2 quantity
          
          saleItems.push({
            productId: product.id,
            quantity: quantity,
            priceAtSale: product.price,
          });
          saleTotal += product.price * quantity;
        }

        batch.set(saleDocRef, {
          id: saleDocRef.id,
          date: saleDate.toISOString(),
          items: saleItems,
          total: saleTotal,
        });
      }
    }

    await batch.commit();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);


  useEffect(() => {
    if (!loading && !user && !['/login', '/signup'].includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);


  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      // Set initialized to true so they don't get seed data on next login
      setDocumentNonBlocking(userDocRef, {
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
        initialized: true 
      }, { merge: true });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Seed data only on login
      await seedInitialData(userCredential.user.uid);
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password.",
      });
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const updateUser = async (name: string, picture?: string) => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: name, photoURL: picture });
       const userDocRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(userDocRef, {
            name: name,
            ...(picture && { picture: picture })
        }, { merge: true });

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, updateUser }}>
       <ProductStoreProvider user={user}>
        {children}
      </ProductStoreProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
