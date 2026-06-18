import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from '@/lib/i18n-provider';
import { AuthProvider } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Inventory & Sales Tracker',
  description: 'An app to track your inventory and sales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-body antialiased"
      )}>
        <FirebaseClientProvider>
          <I18nProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster />
          </I18nProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
