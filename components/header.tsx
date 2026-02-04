"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wifi, User, LogOut, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { axiosBrowser } from "@/lib/axios/browser";

type MeUser = {
  id: string;
  full_name?: string;
  email?: string;
  roles?: string[];
};

type MeResponse = {
  success: boolean;
  message?: string;
  data?: {
    user?: MeUser;
  };
};

export function Header() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<MeUser | null>(null);

  const isAdmin = (user?.roles || []).includes("admin");

  useEffect(() => {
    let isMounted = true;

    async function loadMe() {
      setIsLoading(true);
      try {
        const res = await axiosBrowser.get<MeResponse>("/api/auth/me");
        if (!isMounted) return;

        const u = res.data?.data?.user || null;
        setUser(u);
      } catch {
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    loadMe();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axiosBrowser.post("/api/auth/logout");
    } finally {
      setUser(null);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Wifi className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">NetCards</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            الرئيسية
          </Link>
          <Link href="/packages" className="text-sm font-medium transition-colors hover:text-primary">
            الباقات
          </Link>
          <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
            من نحن
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* أثناء التحميل: لا تقفز UI */}
          {isLoading ? null : user ? (
            <>
              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="ml-2 h-4 w-4" />
                    لوحة التحكم
                  </Link>
                </Button>
              )}

              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  <User className="ml-2 h-4 w-4" />
                  حسابي
                </Link>
              </Button>

              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">تسجيل الدخول</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/sign-up">إنشاء حساب</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
