import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/icons";
import { cn } from "@/lib/utils";

type HeaderProps = {
  title: string;
  className?: string;
};

export function Header({ title, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6",
        className
      )}
    >
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="mr-2 hidden items-center md:flex"
        >
          <Logo className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <LanguageSwitcher />
        <UserNav />
      </div>
    </header>
  );
}
