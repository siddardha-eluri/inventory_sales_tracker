"use client";

import { Check, Languages } from "lucide-react";

import { useTranslation } from "@/lib/hooks/use-translation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { setLanguage, language } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("en")}>
          <Check className={`mr-2 h-4 w-4 ${language === 'en' ? 'opacity-100' : 'opacity-0'}`} />
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("hi")}>
          <Check className={`mr-2 h-4 w-4 ${language === 'hi' ? 'opacity-100' : 'opacity-0'}`} />
          हिंदी
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("te")}>
           <Check className={`mr-2 h-4 w-4 ${language === 'te' ? 'opacity-100' : 'opacity-0'}`} />
          తెలుగు
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
