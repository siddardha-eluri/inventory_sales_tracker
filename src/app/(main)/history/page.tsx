
"use client";

import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/lib/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Product, Sale } from "@/lib/types";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { user, firestore } = useFirebase();
  
  const productsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsRef);

  const salesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesRef);

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        if (date?.from && date?.to) {
          const from = startOfDay(date.from);
          const to = date.to;
          return isWithinInterval(saleDate, { start: from, end: to });
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, date]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title={t.salesHistory} />
      <main className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.salesHistory}</CardTitle>
            <CardDescription>
              {t['Review your past sales transactions.']}
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="mb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>{t.pickADate}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] sm:w-auto">{t.date}</TableHead>
                  <TableHead>{t.Products}</TableHead>
                  <TableHead className="text-right">{t.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoadingProducts || isLoadingSales) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading sales history...</TableCell>
                  </TableRow>
                )}
                {!(isLoadingProducts || isLoadingSales) && filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="hidden sm:table-cell">{format(new Date(sale.date), "PPP")}</TableCell>
                    <TableCell className="sm:hidden table-cell">{format(new Date(sale.date), "MM/dd/yy")}</TableCell>
                    <TableCell>
                      {sale.items.map((item:any) => {
                        const product = products?.find(p => p.id === item.productId);
                        return <div key={item.productId}>{(product ? (t[product.name as keyof typeof t] || product.name) : t.Unknown)} x {item.quantity} {product?.unit}</div>
                      })}
                    </TableCell>
                    <TableCell className="text-right">₹{sale.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
