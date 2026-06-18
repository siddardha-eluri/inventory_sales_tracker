
"use client";

import { useState, useMemo } from "react";
import { Plus, Minus, PlusCircle, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SaleItem, Product } from "@/lib/types";
import { useTranslation } from "@/lib/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useProductStore } from "@/store/products";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function SalesPage() {
  const { t } = useTranslation();
  const { addSale } = useProductStore();
  const { user, firestore } = useFirebase();

  const productsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsRef);
  
  const [newSaleItems, setNewSaleItems] = useState<SaleItem[]>([]);
  const { toast } = useToast();
  
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  const addSaleItem = (productId?: string) => {
    if (!products) return;

    const availableProducts = products.filter(
      p => !newSaleItems.some(item => item.productId === p.id) && p.stock > 0
    );

    const productToAdd = productId
      ? products.find(p => p.id === productId)
      : availableProducts.length > 0 ? availableProducts[0] : undefined;


    if (productToAdd) {
        if(productToAdd.stock === 0) {
            toast({
                variant: "destructive",
                title: t.outOfStock,
                description: `${t[productToAdd.name as keyof typeof t] || productToAdd.name} ${t['is out of stock.']}`,
            });
            return;
        }
        const existingItemIndex = newSaleItems.findIndex(item => item.productId === productToAdd.id);
        if (existingItemIndex > -1) {
            const items = [...newSaleItems];
            const currentItem = items[existingItemIndex];
            if(currentItem.quantity < productToAdd.stock) {
                updateSaleItem(existingItemIndex, 'quantity', currentItem.quantity + 1);
            } else {
                 toast({
                    variant: "destructive",
                    title: t["Stock limit reached"],
                    description: `${t['You cannot add more']} ${t[productToAdd.name as keyof typeof t] || productToAdd.name} ${t['than available in stock.']}`,
                });
            }
        } else {
            setNewSaleItems([
                ...newSaleItems,
                { productId: productToAdd.id, quantity: 1, priceAtSale: productToAdd.price },
            ]);
        }
    } else if (!productId) {
      toast({
        variant: "destructive",
        title: t["No more products to add"],
        description: t["You have added all available products."],
      });
    }
  };

  const updateSaleItem = (index: number, field: keyof SaleItem, value: string | number) => {
    if (!products) return;
    const items = [...newSaleItems];
    const itemToUpdate = { ...items[index] };
    const product = products.find(p => p.id === itemToUpdate.productId);
    
    if (field === 'productId') {
        const newProduct = products.find(p => p.id === value);
        if (newProduct) {
            itemToUpdate.productId = value as string;
            itemToUpdate.priceAtSale = newProduct.price;
            itemToUpdate.quantity = 1;
        }
    } else if (field === 'quantity') {
        const quantity = Number(value);
        if (quantity >= 0 && product && quantity <= product.stock) {
            if(quantity === 0) {
                removeSaleItem(index);
                return;
            }
            itemToUpdate.quantity = quantity;
        } else if (product && quantity > product.stock) {
            toast({
                variant: "destructive",
                title: t["Stock limit reached"],
                description: `${t['You cannot add more']} ${t[product.name as keyof typeof t] || product.name} ${t['than available in stock.']}`,
            });
            itemToUpdate.quantity = product.stock;
        }
    }

    items[index] = itemToUpdate;
    setNewSaleItems(items);
  };
  
  const removeSaleItem = (index: number) => {
    setNewSaleItems(newSaleItems.filter((_, i) => i !== index));
  }

  const newSaleTotal = newSaleItems.reduce((acc, item) => {
    return acc + (item.quantity * item.priceAtSale);
  }, 0);

  const handleSubmitSale = () => {
    if (newSaleItems.length === 0) {
        toast({
            variant: "destructive",
            title: t["Cannot record sale"],
            description: t["Please add items to the sale first."],
        });
        return;
    }

    addSale({
      items: newSaleItems,
      total: newSaleTotal
    }, products || []);
    
    toast({
      title: t["Sale Recorded!"],
      description: `${t['Your sale of']} ₹${newSaleTotal.toFixed(2)} ${t['has been saved.']}`,
    });

    setNewSaleItems([]);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title={t.recordSale} />
      <main className="flex-1 p-4 sm:p-6">
        <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t.recordSale}</CardTitle>
                  <CardDescription>
                      {t['Add products to create a new sale.']}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                {newSaleItems.map((item, index) => {
                  const product = products?.find(p => p.id === item.productId);
                  return (
                    <div key={index} className="flex items-center gap-2 sm:gap-4">
                       <Popover open={openPopoverIndex === index} onOpenChange={(isOpen) => setOpenPopoverIndex(isOpen ? index : null)}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openPopoverIndex === index}
                            className="w-[250px] justify-between"
                          >
                            {item.productId && products
                              ? t[products.find((p) => p.id === item.productId)?.name as keyof typeof t] || products.find((p) => p.id === item.productId)?.name
                              : t["Select a product"]}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                          <ScrollArea className="h-72">
                            <div className="p-1">
                            {products?.map((p) => {
                              const isAlreadySelected = newSaleItems.some(
                                (saleItem) => saleItem.productId === p.id && item.productId !== p.id
                              );
                              return (
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start",
                                    item.productId === p.id && "bg-accent"
                                  )}
                                  key={p.id}
                                  disabled={p.stock === 0 || isAlreadySelected}
                                  onClick={() => {
                                    updateSaleItem(index, 'productId', p.id);
                                    setOpenPopoverIndex(null);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      item.productId === p.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {t[p.name as keyof typeof t] || p.name}
                                </Button>
                              );
                            })}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>

                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateSaleItem(index, 'quantity', item.quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateSaleItem(index, 'quantity', e.target.value)}
                          className="w-16 text-center"
                        />
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateSaleItem(index, 'quantity', item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <span className="w-24 text-right">x ₹{item.priceAtSale.toFixed(2)}</span>
                      {product?.unit && <span className="w-12 text-muted-foreground">{product.unit}</span>}
                      <Button variant="ghost" size="icon" onClick={() => removeSaleItem(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
                <Button variant="outline" onClick={() => addSaleItem()} className="w-full" disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.addToSale}
                </Button>
                <div className="flex flex-col sm:flex-row justify-end items-center pt-4 border-t gap-4">
                    <span className="text-lg font-semibold">{t.total}: ₹{newSaleTotal.toFixed(2)}</span>
                    <Button onClick={handleSubmitSale} className="w-full sm:w-auto">{t.submitSale}</Button>
                </div>
            </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
