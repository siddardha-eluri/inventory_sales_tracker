export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  imageUrl: string;
  unit?: string;
};

export type SaleItem = {
  productId: string;
  quantity: number;
  priceAtSale: number;
};

export type Sale = {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
};

// This can be removed as we now use FirebaseUser
// export type User = {
//   name: string;
//   email: string;
//   picture?: string;
//   password?: string;
// };
