"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { axiosBrowser } from "@/lib/axios/browser";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ArrowRight, Loader2, AlertCircle, CheckCircle2, RefreshCw, Save } from "lucide-react";

type Category = {
    id: number | string;
    name_ar: string;
    name?: string;
    type?: "hourly" | "monthly";
    description?: string | null;
};

type CardsCounts = {
    total: number;
    available: number;
    reserved: number;
    sold: number;
};

type PackageDTO = {
    id: string | number;
    uuid?: string | null;
    name: string;
    name_ar: string;
    description?: string | null;
    duration: string;
    price: string; // "15.00"
    status: "active" | "inactive";
    type: "hourly" | "monthly";
    created_at?: string;
    updated_at?: string;
    category?: Category | null;
    cards_counts?: CardsCounts | null;
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

function fmtDate(v?: string | null) {
    if (!v) return "-";
    const dt = new Date(v);
    if (Number.isNaN(dt.getTime())) return v;
    return dt.toLocaleString("ar", { hour12: true });
}

export default function EditPackagePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const [categories, setCategories] = useState<Category[]>([]);
    const [pkg, setPkg] = useState<PackageDTO | null>(null);

    const [isCatsLoading, setIsCatsLoading] = useState(true);
    const [isPkgLoading, setIsPkgLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [successHint, setSuccessHint] = useState<string | null>(null);

    const [form, setForm] = useState({
        category_id: "",
        name: "",
        name_ar: "",
        description: "",
        duration: "",
        price: "",
        status: "active" as "active" | "inactive",
        type: "monthly" as "hourly" | "monthly",
    });

    const selectedCategory = useMemo(() => {
        return categories.find((c) => String(c.id) === String(form.category_id)) ?? null;
    }, [categories, form.category_id]);

    // type يتحدد تلقائيا حسب نوع الفئة (لو موجود)
    useEffect(() => {
        if (selectedCategory?.type && selectedCategory.type !== form.type) {
            setForm((prev) => ({ ...prev, type: selectedCategory.type! }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory?.type]);

    const loadAll = async () => {
        if (!id) return;

        setError(null);
        setSuccessHint(null);

        setIsCatsLoading(true);
        setIsPkgLoading(true);

        try {
            const [catsRes, pkgRes] = await Promise.all([
                axiosBrowser.get<ApiResponse<Category[]>>("/api/admin/categories"),
                axiosBrowser.get<ApiResponse<{ item: PackageDTO }>>(`/api/admin/packages/${id}?with_category=1&with_counts=1`)
            ]);

            const cats = catsRes.data?.data || [];
            setCategories(cats);

            const p = pkgRes.data?.data?.item ?? null;
            setPkg(p);

            if (p) {
                setForm({
                    category_id: (p as any).category_id ? String((p as any).category_id) : "",
                    name: p.name ?? "",
                    name_ar: p.name_ar ?? "",
                    description: p.description ?? "",
                    duration: p.duration ?? "",
                    price: p.price ?? "",
                    status: p.status ?? "active",
                    type: p.type ?? "monthly",
                });
            }
        } catch (err: any) {
            setError(extractErrorMessage(err));
        } finally {
            setIsCatsLoading(false);
            setIsPkgLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const canSubmit =
        !isCatsLoading &&
        !isPkgLoading &&
        !!form.category_id &&
        form.name.trim().length > 0 &&
        form.name_ar.trim().length > 0 &&
        form.duration.trim().length > 0 &&
        form.price !== "" &&
        !Number.isNaN(Number(form.price));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setIsSaving(true);
        setError(null);
        setSuccessHint(null);

        try {
            const payload = {
                category_id: Number.isNaN(Number(form.category_id)) ? form.category_id : Number(form.category_id),
                name: form.name.trim(),
                name_ar: form.name_ar.trim(),
                description: form.description.trim() ? form.description.trim() : null,
                duration: form.duration.trim(),
                price: String(Number(form.price)),
                status: form.status,
                type: form.type,
            };

            await axiosBrowser.put<ApiResponse<any>>(`/api/admin/packages/${id}`, payload);

            setSuccessHint("تم تحديث الباقة بنجاح ✅");
            await loadAll(); // إعادة تحميل لتحديث updated_at + أي تغييرات
            router.refresh();
        } catch (err: any) {
            setError(extractErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const loading = isCatsLoading || isPkgLoading;

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
                        <h1 className="text-2xl md:text-3xl font-bold">تعديل باقة</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {pkg ? `#${pkg.id}` : `#${id}`} — عدّل البيانات ثم احفظ التغييرات.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={loadAll} disabled={loading || isSaving}>
                            <RefreshCw className="ml-2 h-4 w-4" />
                            تحديث
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-5">
                {/* العمود الرئيسي */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>بيانات الباقة</CardTitle>
                            <CardDescription>تعديل المعلومات الأساسية والسعر والمدة.</CardDescription>
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
                                                required
                                                disabled={loading || isSaving}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="name_ar">الاسم (عربي)</Label>
                                            <Input
                                                id="name_ar"
                                                value={form.name_ar}
                                                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                                                required
                                                disabled={loading || isSaving}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>الفئة</Label>

                                            <Select
                                                value={form.category_id}
                                                onValueChange={(v) => setForm({ ...form, category_id: v })}
                                                disabled={loading || isSaving}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loading ? "جارٍ التحميل..." : "اختر الفئة"} />
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

                                            {selectedCategory?.type ? (
                                                <div className="pt-1">
                                                    <Badge variant="secondary">
                                                        النوع: {selectedCategory.type === "monthly" ? "شهري" : "ساعات"} (auto)
                                                    </Badge>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>الحالة</Label>
                                            <Select
                                                value={form.status}
                                                onValueChange={(v) => setForm({ ...form, status: v as any })}
                                                disabled={loading || isSaving}
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

                                <div className="rounded-xl border p-4 space-y-4">
                                    <h3 className="font-semibold">السعر والمدة</h3>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="duration">المدة</Label>
                                            <Input
                                                id="duration"
                                                value={form.duration}
                                                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                                required
                                                disabled={loading || isSaving}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                سيتم إرسال النوع تلقائيًا حسب الفئة:{" "}
                                                <span className="font-medium">{form.type}</span>.
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
                                                required
                                                disabled={loading || isSaving}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border p-4 space-y-3">
                                    <h3 className="font-semibold">الوصف</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">وصف الباقة (اختياري)</Label>
                                        <Textarea
                                            id="description"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            rows={4}
                                            disabled={loading || isSaving}
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
                                        <>
                                            <Save className="ml-2 h-4 w-4" />
                                            حفظ التغييرات
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* العمود الجانبي */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>تفاصيل الباقة</CardTitle>
                            <CardDescription>معلومات مرجعية + إحصاءات البطاقات.</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    جارٍ تحميل بيانات الباقة...
                                </div>
                            ) : !pkg ? (
                                <div className="text-sm text-muted-foreground">لم يتم العثور على الباقة.</div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="text-muted-foreground">ID</div>
                                        <div className="font-medium">{pkg.id}</div>

                                        <div className="text-muted-foreground">UUID</div>
                                        <div className="font-medium break-all">{pkg.uuid ?? "-"}</div>

                                        <div className="text-muted-foreground">النوع</div>
                                        <div className="font-medium">{pkg.type}</div>

                                        <div className="text-muted-foreground">الحالة</div>
                                        <div className="font-medium">{pkg.status}</div>

                                        <div className="text-muted-foreground">Created</div>
                                        <div className="font-medium">{fmtDate(pkg.created_at)}</div>

                                        <div className="text-muted-foreground">Updated</div>
                                        <div className="font-medium">{fmtDate(pkg.updated_at)}</div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">إحصاءات البطاقات</span>
                                            <Badge variant="outline">cards</Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="text-muted-foreground">Total</div>
                                            <div className="font-medium">{pkg.cards_counts?.total ?? 0}</div>

                                            <div className="text-muted-foreground">Available</div>
                                            <div className="font-medium">{pkg.cards_counts?.available ?? 0}</div>

                                            <div className="text-muted-foreground">Reserved</div>
                                            <div className="font-medium">{pkg.cards_counts?.reserved ?? 0}</div>

                                            <div className="text-muted-foreground">Sold</div>
                                            <div className="font-medium">{pkg.cards_counts?.sold ?? 0}</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-4 text-xs text-muted-foreground">
                        ملاحظة: النوع <span className="font-medium">type</span> يتبع نوع الفئة غالبًا. إذا بدك نخليه قابل للتعديل يدويًا
                        أضيف لك Select بسيط.
                    </div>
                </div>
            </div>
        </div>
    );
}
