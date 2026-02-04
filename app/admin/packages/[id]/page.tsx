// app/admin/packages/[id]/page.tsx
import Link from "next/link";
import { laravelServerFetch } from "@/lib/laravel/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Clock, Upload } from "lucide-react";
import PackageDetailsCards, { PackageCardRow } from "@/components/admin/packages/package-details-cards";

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data: T;
    errors?: Record<string, string[]>;
};

type Meta = {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
};

type CategoryDTO = {
    id: string;
    name_ar: string;
    type: "hourly" | "monthly";
    description?: string | null;
};

type PackageDTO = {
    id: string;
    uuid: string;
    category_id: string;
    name: string;
    name_ar: string;
    description?: string | null;
    duration: string;
    price: string;
    status: "active" | "inactive";
    category?: CategoryDTO | null;
    cards_counts?: {
        total: number;
        available: number;
        reserved: number;
        sold: number;
    };
};

function iconByType(type?: "hourly" | "monthly") {
    return type === "hourly" ? (
        <Clock className="h-5 w-5 text-primary" />
    ) : (
        <Calendar className="h-5 w-5 text-primary" />
    );
}

function qs(params: Record<string, any>) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || String(v).trim() === "") return;
        sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : "";
}

// ✅ يحوّل UUID القادم من /admin/packages/{uuid} إلى ID رقمي عبر قائمة الباقات (status=active)
// ملاحظة: endpoint list يرجّع data.items[] وفي كل عنصر عندك id + uuid
async function resolveNumericIdFromUuid(uuidOrId: string): Promise<string> {
    // إذا كانت رقم أصلاً، رجّعها مباشرة
    if (/^\d+$/.test(uuidOrId)) return uuidOrId;

    const listRes = await laravelServerFetch("/api/admin/packages?status=active");
    const listPayload = listRes as ApiResponse<{ items: Array<{ id: string; uuid: string }> }>;

    const items = listPayload?.data?.items ?? [];
    const found = items.find((p) => p.uuid === uuidOrId);

    if (!found?.id) throw new Error("PACKAGE_NOT_FOUND");
    return found.id;
}

export default async function AdminPackageDetailsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { id: rawId } = await params;
    const sp = (await searchParams) ?? {};

    const username = Array.isArray(sp.username) ? sp.username[0] : sp.username;
    const status = Array.isArray(sp.status) ? sp.status[0] : sp.status;
    const page = Array.isArray(sp.page) ? sp.page[0] : sp.page;
    const per_page = Array.isArray(sp.per_page) ? sp.per_page[0] : sp.per_page;

    // ✅ حل مشكلة UUID vs ID: دايماً اشتغل بـ numeric ID عند استدعاء Laravel show/cards
    let id = rawId;
    try {
        id = await resolveNumericIdFromUuid(rawId);
    } catch {
        return (
            <div className="p-8">
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">لم يتم العثور على الباقة.</CardContent>
                </Card>
            </div>
        );
    }

    // 1) package details
    const pRes = await laravelServerFetch(`/api/admin/packages/${id}`);
    const pPayload = pRes as ApiResponse<{ item: PackageDTO }>;
    const pkg = pPayload?.data?.item;

    if (!pkg) {
        return (
            <div className="p-8">
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">لم يتم العثور على الباقة.</CardContent>
                </Card>
            </div>
        );
    }

    // 2) cards list
    const cQuery = qs({ username, status, page: page ?? "1", per_page: per_page ?? "20" });
    const cRes = await laravelServerFetch(`/api/admin/packages/${id}/cards${cQuery}`);
    const cPayload = cRes as ApiResponse<{ items: PackageCardRow[]; meta: Meta }>;

    const cards = cPayload?.data?.items ?? [];
    const meta = cPayload?.data?.meta;

    const type = pkg.category?.type;
    const isActive = pkg.status === "active";
    const counts = pkg.cards_counts ?? { total: 0, available: 0, reserved: 0, sold: 0 };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Button variant="ghost" asChild className="px-0">
                        <Link href="/admin/packages">
                            <ArrowRight className="ml-2 h-4 w-4" />
                            العودة للباقات
                        </Link>
                    </Button>

                    <h1 className="mt-2 text-3xl font-bold">{pkg.name_ar}</h1>
                    <p className="mt-2 text-muted-foreground">{pkg.description || "—"}</p>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "نشط" : "معطل"}</Badge>
                    <Button variant="outline" asChild>
                        <Link href="/admin/cards/import">
                            <Upload className="ml-2 h-4 w-4" />
                            رفع بطاقات
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">الفئة</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            {iconByType(type)}
                        </div>
                        <div>
                            <div className="font-semibold">{pkg.category?.name_ar || "—"}</div>
                            <div className="text-sm text-muted-foreground">{type === "hourly" ? "ساعات" : "شهري"}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">المدة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pkg.duration}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">السعر</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">₪ {pkg.price}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي البطاقات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.total}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">متوفرة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{counts.available}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">محجوزة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{counts.reserved}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">مباعة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{counts.sold}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>بطاقات الباقة</CardTitle>
                    {meta && (
                        <div className="text-sm text-muted-foreground">
                            صفحة {meta.current_page} / {meta.total_pages} — الإجمالي {meta.total_items}
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <PackageDetailsCards cards={cards} meta={meta} />
                </CardContent>
            </Card>
        </div>
    );
}
