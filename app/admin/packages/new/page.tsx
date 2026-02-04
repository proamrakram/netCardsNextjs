"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { axiosBrowser } from "@/lib/axios/browser";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Category = {
  id: number | string;
  name_ar: string;
  name?: string;
  type?: "hourly" | "monthly";
  description?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
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
  return err?.message || "حدث خطأ غير متوقع";
}

export default function NewPackagePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCatsLoading, setIsCatsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successHint, setSuccessHint] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    description: "",
    duration: "",
    price: "",
    category_id: "",
    status: "active" as "active" | "inactive",
    type: "monthly" as "hourly" | "monthly",
  });

  const selectedCategory = useMemo(() => {
    return categories.find((c) => String(c.id) === String(form.category_id)) ?? null;
  }, [categories, form.category_id]);

  useEffect(() => {
    // لو الفئة عندها type، خلّي type في الفورم يتحدد تلقائيًا
    if (selectedCategory?.type && selectedCategory.type !== form.type) {
      setForm((prev) => ({ ...prev, type: selectedCategory.type! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory?.type]);

  useEffect(() => {
    let mounted = true;

    async function fetchCategories() {
      setIsCatsLoading(true);
      setError(null);

      try {
        // هذا الـ route هو اللي عملناه فوق (يرجع data: Category[])
        const res = await axiosBrowser.get<ApiResponse<Category[]>>("/api/admin/categories");
        const list = res.data?.data || [];
        if (!mounted) return;
        setCategories(list);
      } catch (err: any) {
        if (!mounted) return;
        setError(extractErrorMessage(err));
      } finally {
        if (!mounted) return;
        setIsCatsLoading(false);
      }
    }

    fetchCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit =
    !isCatsLoading &&
    !!form.category_id &&
    form.name.trim().length > 0 &&
    form.name_ar.trim().length > 0 &&
    form.duration.trim().length > 0 &&
    form.price !== "" &&
    !Number.isNaN(Number(form.price));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessHint(null);

    try {
      // Laravel يتوقع: category_id, name, name_ar, description, duration, price, status, type
      const payload = {
        category_id: Number.isNaN(Number(form.category_id)) ? form.category_id : Number(form.category_id),
        name: form.name.trim(),
        name_ar: form.name_ar.trim(),
        description: form.description.trim() ? form.description.trim() : null,
        duration: form.duration.trim(),
        price: String(Number(form.price)), // خليها string زي postman (أو رقم—حسب Laravel validation)
        status: form.status,
        type: form.type,
      };

      await axiosBrowser.post<ApiResponse<any>>("/api/admin/packages", payload);

      setSuccessHint("تم إنشاء الباقة بنجاح ✅");
      router.push("/admin/packages");
      router.refresh();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <Button variant="ghost" className="w-fit" asChild>
          <Link href="/admin/packages">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للباقات
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">إضافة باقة جديدة</h1>
            <p className="text-sm text-muted-foreground mt-1">
              أدخل معلومات الباقة ثم احفظها لإضافتها للنظام.
            </p>
          </div>

          {selectedCategory?.type ? (
            <Badge variant="secondary" className="mt-1">
              النوع: {selectedCategory.type === "monthly" ? "شهري" : "ساعات"}
            </Badge>
          ) : (
            <Badge variant="outline" className="mt-1">
              اختر فئة لتحديد النوع
            </Badge>
          )}
        </div>
      </div>

      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>معلومات الباقة</CardTitle>
          <CardDescription>املأ الحقول الأساسية ثم اضغط حفظ.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>{error}</div>
            </div>
          )}

          {successHint && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
              <div>{successHint}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* القسم 1 */}
            <div className="rounded-xl border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">البيانات الأساسية</h3>
                <Badge variant={form.status === "active" ? "default" : "secondary"}>
                  {form.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم (إنجليزي)</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. One Month Package"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_ar">الاسم (عربي)</Label>
                  <Input
                    id="name_ar"
                    value={form.name_ar}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    placeholder="مثال: باقة شهر واحد"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>الفئة</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => setForm({ ...form, category_id: v })}
                    disabled={isCatsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isCatsLoading ? "جارٍ تحميل الفئات..." : "اختر الفئة"} />
                    </SelectTrigger>

                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={String(cat.id)} value={String(cat.id)}>
                          {cat.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedCategory?.description ? (
                    <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* القسم 2 */}
            <div className="rounded-xl border p-4 space-y-4">
              <h3 className="font-semibold">السعر والمدة</h3>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="duration">المدة</Label>
                  <Input
                    id="duration"
                    placeholder={form.type === "monthly" ? "مثال: 1 month" : "مثال: 5 hours"}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    سيتم إرسال النوع تلقائيًا حسب الفئة: {form.type === "monthly" ? "monthly" : "hourly"}.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">السعر</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="15"
                    required
                  />
                </div>
              </div>
            </div>

            {/* القسم 3 */}
            <div className="rounded-xl border p-4 space-y-3">
              <h3 className="font-semibold">الوصف (اختياري)</h3>
              <div className="space-y-2">
                <Label htmlFor="description">وصف الباقة</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="اكتب وصف مختصر…"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : (
                "حفظ الباقة"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
