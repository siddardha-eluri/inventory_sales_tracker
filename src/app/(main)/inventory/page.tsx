
"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { useTranslation } from "@/lib/hooks/use-translation";
import Image from "next/image";
import { useProductStore } from "@/store/products";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function InventoryPage() {
  const { t } = useTranslation();
  const { addProduct, updateProduct, deleteProduct } = useProductStore();
  const { user, firestore } = useFirebase();

  const productsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsRef);

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const getStockStatus = (stock: number, lowStockThreshold: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">{t.outOfStock}</Badge>;
    }
    if (stock < lowStockThreshold) {
      return <Badge variant="destructive" className="bg-yellow-500 text-black">{t.lowStockAlert}</Badge>;
    }
    return <Badge variant="secondary">{t.inStock}</Badge>;
  };

  const handleAddProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProduct = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      lowStockThreshold: Number(formData.get("lowStockThreshold")),
      category: formData.get("category") as string,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/300`,
      unit: formData.get("unit") as string,
    };
    addProduct(newProduct);
    setAddDialogOpen(false);
  };
  
  const handleEditProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(event.currentTarget);
    const updatedProduct: Product = {
      ...editingProduct,
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
    };
    updateProduct(updatedProduct);
    setEditDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title={t.inventory} />
      <main className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t.inventoryOverview}</CardTitle>
                <CardDescription>
                  {t['Monitor and manage your product stock levels.']}
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      {t.addNewProduct}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.addNewProduct}</DialogTitle>
                    <DialogDescription>
                      {t['Fill in the details to add a new product to your inventory.']}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct}>
                    <ScrollArea className="h-[60vh] sm:h-auto">
                      <div className="grid gap-4 py-4 px-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">{t.productName}</Label>
                          <Input id="name" name="name" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="description" className="text-right">{t.productDescription}</Label>
                          <Input id="description" name="description" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="price" className="text-right">{t.price}</Label>
                          <Input id="price" name="price" type="number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="stock" className="text-right">{t.initialStock}</Label>
                          <Input id="stock" name="stock" type="number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="lowStockThreshold" className="text-right">{t.lowStockThreshold}</Label>
                          <Input id="lowStockThreshold" name="lowStockThreshold" type="number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category" className="text-right">{t.category}</Label>
                          <Input id="category" name="category" className="col-span-3" required />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="unit" className="text-right">{t.Unit}</Label>
                          <Input id="unit" name="unit" placeholder={t['e.g., kg, liter, piece']} className="col-span-3" />
                        </div>
                      </div>
                    </ScrollArea>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>{t.cancel}</Button>
                      <Button type="submit">{t.save}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">{t.Image}</TableHead>
                  <TableHead>{t.productName}</TableHead>
                  <TableHead>{t.stock}</TableHead>
                  <TableHead>{t.Status}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.price}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t.Actions}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading products...</TableCell>
                  </TableRow>
                )}
                {!isLoading && products?.map((product) => (
                  <TableRow key={product.id}>
                     <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={t[product.name as keyof typeof t] || product.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={product.imageUrl}
                        width="64"
                        data-ai-hint="product image"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{t[product.name as keyof typeof t] || product.name}</TableCell>
                    <TableCell>{product.stock} {product.unit}</TableCell>
                    <TableCell>{getStockStatus(product.stock, product.lowStockThreshold)}</TableCell>
                    <TableCell className="hidden md:table-cell">₹{product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t['Toggle menu']}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t.Actions}</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => { setEditingProduct(product); setEditDialogOpen(true); }}>{t.Edit}</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setDeletingProduct(product); setDeleteDialogOpen(true); }}>{t.Delete}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t['Edit Product']}</DialogTitle>
                    <DialogDescription>
                        {t['Update the details of your product.']}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditProduct}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">{t.productName}</Label>
                            <Input id="edit-name" name="name" defaultValue={editingProduct ? (t[editingProduct.name as keyof typeof t] || editingProduct.name) : ''} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-price" className="text-right">{t.price}</Label>
                            <Input id="edit-price" name="price" type="number" defaultValue={editingProduct?.price} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-stock" className="text-right">{t.stock}</Label>
                            <Input id="edit-stock" name="stock" type="number" defaultValue={editingProduct?.stock} className="col-span-3" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>{t.cancel}</Button>
                        <Button type="submit">{t['Save Changes']}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t['Are you sure?']}</AlertDialogTitle>
              <AlertDialogDescription>
                {t['This action cannot be undone. This will permanently delete the product']} &quot;{deletingProduct ? (t[deletingProduct.name as keyof typeof t] || deletingProduct.name) : ''}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct}>
                {t.Continue}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}
