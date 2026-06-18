
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, LineChart, Archive, History } from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function Nav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const menuItems = [
    { href: "/", label: t.dashboard, icon: Home },
    { href: "/sales", label: t.recordSale, icon: ShoppingCart },
    { href: "/history", label: t.salesHistory, icon: History },
    { href: "/trends", label: t.trends, icon: LineChart },
    { href: "/inventory", label: t.inventory, icon: Archive },
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
