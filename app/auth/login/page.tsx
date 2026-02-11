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
import { Wifi, Loader2, Phone, EyeOff, Eye, Lock } from "lucide-react";
import { axiosBrowser } from "@/lib/axios/browser"; // <-- تأكد من وجوده


/** Input group with left icon + optional right action (like show/hide). */
function InputGroup(props: {
  id: string;
  label: string;
  icon: React.ReactNode;
  input: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <div className="relative">
        {/* Left icon */}
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          {props.icon}
        </div>

        {props.input}
      </div>

      {props.hint ? <p className="text-xs text-muted-foreground">{props.hint}</p> : null}
    </div>
  );
}

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
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await axiosBrowser.post<LoginResponse>("/api/auth/login", {
        phone,
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

                  {/* Phone (required + LTR) */}
                  <div className="grid gap-2">

                    <InputGroup
                      id="phone"
                      label="رقم الهاتف"
                      icon={<Phone className="h-4 w-4" />}
                      hint="مثال: 059xxxxxxxx"

                      input={
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="059 123 4567"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          dir="ltr"
                          className="pl-10 text-left"
                          autoComplete="tel"
                          maxLength={10}
                        />
                      }
                    />
                  </div>


                  {/* <div className="grid gap-2">
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
                  </div> */}

                  <div className="grid gap-2">
                    <Label htmlFor="password">كلمة المرور</Label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>

                      <Input
                        id="password"
                        type={showPass ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        dir="ltr"
                        className="pl-10 pr-10 text-left"
                        autoComplete="new-password"
                        placeholder="••••••••"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute inset-y-0 right-2 flex items-center rounded-md px-2 text-muted-foreground hover:text-foreground"
                        aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        tabIndex={-1}
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

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
