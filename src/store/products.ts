
import { create } from 'zustand';
import { Product } from '@/lib/types';
import { INITIAL_PRODUCTS } from '@/lib/constants';
import { createContext, useContext, useRef } from 'react';
import type { StoreApi } from 'zustand';

interface ProductState {
  products: Product[];
  addProduct: (product: Product) => void;
  decreaseStock: (productId: string, quantity: number) => void;
}

const createProductStore = () => create<ProductState>((set) => ({
  products: INITIAL_PRODUCTS,
  addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),
  decreaseStock: (productId, quantity) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
      ),
    })),
}));

const ProductStoreContext = createContext<StoreApi<ProductState> | null>(null);

const ProductStoreProvider = ({ children }: { children: React.ReactNode }) => {
    const storeRef = useRef<StoreApi<ProductState>>();
    if (!storeRef.current) {
        storeRef.current = createProductStore();
    }
    return (
        <ProductStoreContext.Provider value={storeRef.current}>
            {children}
        </ProductStoreContext.Provider>
    );
}

const useProductStore = <T>(selector: (state: ProductState) => T) => {
    const store = useContext(ProductStoreContext);
    if (!store) {
        throw new Error('useProductStore must be used within a ProductStoreProvider');
    }
    return store(selector);
};

export { createProductStore, ProductStoreProvider, useProductStore };
