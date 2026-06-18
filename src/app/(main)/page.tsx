
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { isToday, format, subDays } from "date-fns";
import {
  PlusCircle,
  Archive,
  FileText,
  AlertTriangle,
  ArrowRight,
  Wifi,
  Star
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { useTranslation } from "@/lib/hooks/use-translation";
import { useProductStore } from "@/store/products";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Product, Sale } from "@/lib/types";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, firestore } = useFirebase();

  const productsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const { data: products } = useCollection<Product>(productsRef);

  const salesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
  const { data: sales } = useCollection<Sale>(salesRef);

  const todayStats = useMemo(() => {
    if (!sales || !products) return { totalRevenue: 0, transactions: 0, itemsSoldCount: 0, topProduct: null };
    const todaySales = sales.filter(sale => isToday(new Date(sale.date)));
    const totalRevenue = todaySales.reduce((acc, sale) => acc + sale.total, 0);
    const transactions = todaySales.length;
    const itemsSoldCount = todaySales.reduce((acc, sale) => acc + sale.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);

    const productSalesToday: Record<string, number> = {};
    todaySales.forEach(sale => {
        sale.items.forEach(item => {
            productSalesToday[item.productId] = (productSalesToday[item.productId] || 0) + item.quantity;
        });
    });

    const topSellingToday = Object.entries(productSalesToday).sort((a, b) => b[1] - a[1])[0];
    const topProduct = topSellingToday ? products.find(p => p.id === topSellingToday[0]) : null;

    return { totalRevenue, transactions, itemsSoldCount, topProduct };
  }, [sales, products]);

  const quickStats = useMemo(() => {
    if (!products) return { lowStockCount: 0 };
    const lowStockCount = products.filter(
      (p) => p.stock <= p.lowStockThreshold
    ).length;
    return { lowStockCount };
  }, [products]);

  const last7DaysSales = useMemo(() => {
    if (!sales) return [];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, i);
      const salesOnDate = sales.filter(sale => format(new Date(sale.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      const total = salesOnDate.reduce((acc, sale) => acc + sale.total, 0);
      return {
        name: format(date, 'EEE'),
        total,
      };
    }).reverse();
    return last7Days;
  }, [sales]);

  const quickActions = [
    { label: t.recordSale, href: "/sales", icon: PlusCircle },
    { label: t.inventory, href: "/inventory", icon: Archive },
    { label: t.analyzeTrends, href: "/trends", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title={t.dashboard} />
      <main className="flex-1 p-4 sm:p-6">
        <div className="grid gap-6">
          {/* Today's Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t['Today\'s Summary']}</CardTitle>
                <CardDescription>{format(new Date(), "MMMM dd, yyyy")}</CardDescription>
              </div>
               <div className="flex items-center gap-2 text-sm text-green-500">
                <Wifi className="h-4 w-4" />
                <span>{t.Online}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <h3 className="text-2xl font-bold">₹{todayStats.totalRevenue.toFixed(2)}</h3>
                  <p className="text-sm text-muted-foreground">{t['Total Sales']}</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{todayStats.transactions}</h3>
                  <p className="text-sm text-muted-foreground">{t.Transactions}</p>
                </div>
                 <div>
                  <h3 className="text-2xl font-bold">₹0.00</h3>
                  <p className="text-sm text-muted-foreground">{t['Total Profit']}</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{todayStats.itemsSoldCount}</h3>
                  <p className="text-sm text-muted-foreground">{t['Items Sold']}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Star className="text-yellow-400" /> {t['Top Selling Today']}</CardTitle>
              </CardHeader>
              <CardContent>
                {todayStats.topProduct ? (
                     <p className="text-xl font-semibold">{t[todayStats.topProduct.name as keyof typeof t] || todayStats.topProduct.name}</p>
                ) : (
                    <p className="text-muted-foreground">{t['No sales yet today.']}</p>
                )}
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="text-yellow-500" /> {t['Low Stock Items']}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{quickStats.lowStockCount}</p>
              </CardContent>
              <CardFooter>
                 <Link href="/inventory" className="text-sm text-primary hover:underline flex items-center gap-1">
                    {t['View All']} <ArrowRight className="h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
             <Card className="lg:col-span-1">
                 <CardHeader>
                    <CardTitle className="text-base">{t['Pending Restocks']}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xl font-semibold">0</p>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground">{t['No items to restock.']}</p>
                </CardFooter>
            </Card>


            {/* Graph Snapshot & Quick Actions */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>{t['Last 7 Days Sales']}</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={last7DaysSales}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        cursor={{fill: 'hsl(var(--accent))', opacity: 0.5}}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>{t['Quick Actions']}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Button key={action.href} asChild variant="outline" className="h-20 flex-col gap-2">
                             <Link href={action.href}>
                                <action.icon className="h-6 w-6 text-primary" />
                                <span>{action.label}</span>
                             </Link>
                        </Button>
                    ))}
                </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
