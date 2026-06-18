
import { create, useStore } from 'zustand';
import type { User } from 'firebase/auth';
import { createContext, useContext, useRef, type ReactNode, useEffect, useState, useMemo } from 'react';
import type { StoreApi } from 'zustand';
import {
  collection,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';

import { Product, Sale } from '@/lib/types';
import { 
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase/non-blocking-updates';

interface AppState {
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'date'>, currentProducts: Product[]) => void;
}

const createAppStore = (userId: string, firestore: any) => {
  const productsCollection = collection(firestore, 'users', userId, 'products');
  const salesCollection = collection(firestore, 'users', userId, 'sales');

  return create<AppState>((set) => ({
    addProduct: (product) => {
      const newProduct = { ...product, stock: Number(product.stock) || 0 };
      addDocumentNonBlocking(productsCollection, newProduct);
    },
    updateProduct: (product) => {
      const productRef = doc(firestore, 'users', userId, 'products', product.id);
      updateDocumentNonBlocking(productRef, product);
    },
    deleteProduct: (productId) => {
      const productRef = doc(firestore, 'users', userId, 'products', productId);
      deleteDocumentNonBlocking(productRef);
    },
    addSale: (sale, currentProducts) => {
      const newSale = {
        ...sale,
        date: new Date().toISOString(),
        total: sale.items.reduce((acc, item) => acc + item.priceAtSale * item.quantity, 0)
      };

      addDocumentNonBlocking(salesCollection, newSale);

      const batch = writeBatch(firestore);

      sale.items.forEach(item => {
        const product = currentProducts.find(p => p.id === item.productId);
        if (product) {
          const productRef = doc(firestore, 'users', userId, 'products', item.productId);
          const newStock = Math.max(0, product.stock - item.quantity);
          batch.update(productRef, { stock: newStock });
        }
      });
      batch.commit().catch(console.error);
    },
  }));
};

const AppStoreContext = createContext<StoreApi<AppState> | null>(null);

export const ProductStoreProvider = ({ children, user }: { children: ReactNode; user: User | null }) => {
  const { firestore } = useFirebase();

  const store = useMemo(() => {
    if (user && firestore) {
      return createAppStore(user.uid, firestore);
    }
    return null;
  }, [user, firestore]);
  
  if (!user || !store) {
     return <>{children}</>
  }

  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  );
};


export const useProductStore = () => {
    const store = useContext(AppStoreContext);
    if (!store) {
        throw new Error('useProductStore must be used within a AppStoreProvider');
    }
    return useStore(store);
};

export const useProductStoreWithSelector = <T,>(selector: (state: AppState) => T): T => {
    const store = useContext(AppStoreContext);
    if (!store) {
        throw new Error('useProductStore must be used within a AppStoreProvider');
    }
    return useStore(store, selector);
};
