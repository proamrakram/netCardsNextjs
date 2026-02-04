"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Wifi, Loader2 } from "lucide-react";
import { axiosBrowser } from "@/lib/axios/browser"; // <-- تأكد من وجوده

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    token?: string; // لن نستخدمه في المتصفح (محفوظ Cookie HttpOnly)
    user?: {
      id: string;
      full_name?: string;
      email: string;
      phone?: string;
      roles?: string[];
    };
  };
};

function extractErrorMessage(err: any): string {
  // Axios error shape
  const data = err?.response?.data;

  // Laravel validation errors: { errors: { field: ["msg"] } }
  const fieldErrors = data?.errors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstKey = Object.keys(fieldErrors)[0];
    const firstMsg = Array.isArray(fieldErrors[firstKey]) ? fieldErrors[firstKey][0] : null;
    if (firstMsg) return firstMsg;
  }

  // Standard API message
  if (data?.message) return data.message;

  // Fallback
  return err?.message || "حدث خطأ أثناء تسجيل الدخول";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await axiosBrowser.post<LoginResponse>("/api/auth/login", {
        email,
        password,
        device_name: "web", // مهم للـ Sanctum token naming
      });

      const roles = res.data?.data?.user?.roles || [];

      if (roles.includes("admin")) {
        console.log("[LOGIN PAGE] redirect admin");
        router.push("/admin");
      } else {
        console.log("[LOGIN PAGE] redirect dashboard");
        router.push("/dashboard");
      }

      router.refresh();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary/5 to-background p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                <Wifi className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
              <CardDescription>أدخل بيانات حسابك للوصول إلى لوحة التحكم</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      dir="ltr"
                      className="text-left"
                      autoComplete="email"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                      className="text-left"
                      autoComplete="current-password"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جارٍ تسجيل الدخول...
                      </>
                    ) : (
                      "تسجيل الدخول"
                    )}
                  </Button>
                </div>

                <div className="mt-4 text-center text-sm">
                  ليس لديك حساب؟{" "}
                  <Link href="/auth/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
                    إنشاء حساب جديد
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
