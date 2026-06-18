"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from '@/lib/hooks/use-translation';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.displayName || '');
  const [picture, setPicture] = useState(user?.photoURL || '');

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setPicture(user.photoURL || '');
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const getInitials = (name: string | null) => {
    if (!name) return '';
    return name.split(" ").map((n) => n[0]).join("");
  };

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    updateUser(name, picture);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title={t.profile} />
      <main className="flex-1 p-4 sm:p-6">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t.profile}</CardTitle>
            <CardDescription>Manage your account settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={picture} alt={`@${name}`} />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="picture-upload" className="cursor-pointer">
                    <Button asChild variant="outline">
                        <span>Change Picture</span>
                    </Button>
                </Label>
                <Input id="picture-upload" type="file" accept="image/*" className="hidden" onChange={handlePictureUpload}/>
                <p className="text-sm text-muted-foreground mt-2">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input id="email" value={user.email || ''} disabled />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveChanges}>{t.save}</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
