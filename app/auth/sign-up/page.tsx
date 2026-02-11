"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { axiosBrowser } from "@/lib/axios/browser";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Wifi,
  Loader2,
  User,
  Mail,
  Phone,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

type RegisterResponse = {
  success: boolean;
  message: string;
  data?: {
    token?: string;
    user?: {
      id: string;
      email: string;
      full_name?: string;
      phone?: string;
      roles?: string[];
    };
  };
};

function extractErrorMessage(err: any): string {
  const data = err?.response?.data;

  const fieldErrors = data?.errors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstKey = Object.keys(fieldErrors)[0];
    const firstMsg = Array.isArray(fieldErrors[firstKey]) ? fieldErrors[firstKey][0] : null;
    if (firstMsg) return firstMsg;
  }

  if (data?.message) return data.message;

  return err?.message || "حدث خطأ أثناء إنشاء الحساب";
}

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

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  // const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      // email.trim().length > 0 &&
      username.trim().length > 0 &&
      phone.trim().length > 0 && // ✅ phone required (Laravel)
      password.length >= 8 && // ✅ min 8 (Laravel)
      confirmPassword.length >= 8 &&
      password === confirmPassword &&
      !isLoading
    );
  }, [fullName, username, phone, password, confirmPassword, isLoading]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Front validation سريع مطابق للباك اند
    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      setIsLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError("رقم الهاتف مطلوب");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axiosBrowser.post<RegisterResponse>("/api/auth/register", {
        full_name: fullName.trim(),
        // email: email.trim(),
        phone: phone.trim(),
        username: username.trim(),
        password,
        password_confirmation: confirmPassword,
        device_name: "web",
      });

      console.log(res);
      
      const roles = res.data?.data?.user?.roles || [];
      if (roles.includes("admin")) router.push("/admin");
      else router.push("/auth/sign-up-success");

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
          <Card className="overflow-hidden">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
                <Wifi className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
              <CardDescription>أنشئ حسابك للبدء في شراء بطاقات الإنترنت</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Full name (RTL ok) */}
                <InputGroup
                  id="fullName"
                  label="الاسم الكامل"
                  icon={<User className="h-4 w-4" />}
                  input={
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="أدخل اسمك الكامل"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className="pl-10"
                    />
                  }
                />

                {/* Email (LTR + left aligned) */}
                {/* <InputGroup
                  id="email"
                  label="البريد الإلكتروني"
                  icon={<Mail className="h-4 w-4" />}
                  input={
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      dir="ltr"
                      className="pl-10 text-left"
                      autoComplete="email"
                    />
                  }
                /> */}

                {/* Phone (required + LTR) */}
                <InputGroup
                  id="phone"
                  label="رقم الهاتف"
                  icon={<Phone className="h-4 w-4" />}
                  hint="مثال: 059xxxxxxxx أو +97059xxxxxxx"

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

                {/* Username (LTR like email) */}
                <InputGroup
                  id="username"
                  label="اسم المستخدم"
                  icon={<AtSign className="h-4 w-4" />}
                  input={
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      dir="ltr"
                      className="pl-10 text-left"
                      autoComplete="username"
                      maxLength={20}
                    />
                  }
                />

                {/* Password (LTR + show/hide right) */}
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

                  <p className="text-xs text-muted-foreground">على الأقل 8 أحرف</p>
                </div>

                {/* Confirm password */}
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>

                    <Input
                      id="confirmPassword"
                      type={showConfirmPass ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      dir="ltr"
                      className="pl-10 pr-10 text-left"
                      autoComplete="new-password"
                      placeholder="••••••••"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPass((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center rounded-md px-2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      tabIndex={-1}
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <div>{error}</div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={!canSubmit}>
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جارٍ إنشاء الحساب...
                    </>
                  ) : (
                    "إنشاء حساب"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  لديك حساب بالفعل؟{" "}
                  <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                    تسجيل الدخول
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
