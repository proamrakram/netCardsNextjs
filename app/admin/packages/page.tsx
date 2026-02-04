"use client";

import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package as PackageIcon,
  Plus,
  Clock,
  Calendar,
  FilterX,
  Search,
  Loader2,
} from "lucide-react";

type PackageStatus = "active" | "inactive" | string;

type CardsCounts = {
  total: number;
  available: number;
  reserved: number;
  sold: number;
};

type CategoryDTO = {
  id: string;
  name_ar?: string;
  type?: "hourly" | "monthly";
};

type AdminPackageApiItem = {
  id: string;
  uuid: string;
  name_ar: string;
  description?: string | null;
  duration: string;
  price: string;
  status: PackageStatus;
  category?: CategoryDTO | null;
  cards_counts?: CardsCounts | null;
};

type PaginationMeta = {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data: {
    items: AdminPackageApiItem[];
    meta?: PaginationMeta;
  };
};

function iconByType(type?: "hourly" | "monthly") {
  return type === "hourly" ? (
    <Clock className="h-5 w-5 text-primary" />
  ) : (
    <Calendar className="h-5 w-5 text-primary" />
  );
}

type Filters = {
  search: string;
  category_id: string | null;
  status: Array<"active" | "inactive">;
  type: Array<"hourly" | "monthly">;
  per_page: number;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  category_id: null,
  status: [],
  type: [],
  per_page: 20,
};

const toggle = <T,>(arr: T[], value: T) =>
  arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

function extractAxiosError(err: unknown): string {
  const e = err as AxiosError<any>;
  const msg =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    "Request failed.";
  return typeof msg === "string" ? msg : "Request failed.";
}

async function postPackages(filters: Filters): Promise<ApiResponse> {
  const res = await axios.post<ApiResponse>(
    "/api/admin/packages/index",
    {
      search: filters.search,
      category_id: filters.category_id,
      status: filters.status,
      type: filters.type,
      per_page: filters.per_page,
      with_category: 1,
    },
    {
      // مهم: حتى تبقى الكوكيز/السيشن شغالة لو احتجت
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
}

export default function AdminPackagesPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [payload, setPayload] = useState<ApiResponse | null>(null);

  const items = payload?.data?.items ?? [];

  const rows = useMemo(() => {
    return items.map((p) => {
      const counts = p.cards_counts ?? { total: 0, available: 0, reserved: 0, sold: 0 };
      return {
        id: p.id,
        uuid: p.uuid,
        name_ar: p.name_ar,
        description: p.description ?? null,
        duration: p.duration,
        price: p.price,
        is_active: p.status === "active",
        category_type: p.category?.type ?? "unknown",
        category_name_ar: p.category?.name_ar ?? "—",
        counts,
      };
    });
  }, [items]);

  const kpi = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.packages += 1;
        acc.cards_total += r.counts.total;
        acc.cards_available += r.counts.available;
        acc.cards_reserved += r.counts.reserved;
        acc.cards_sold += r.counts.sold;
        return acc;
      },
      { packages: 0, cards_total: 0, cards_available: 0, cards_reserved: 0, cards_sold: 0 }
    );
  }, [rows]);

  const hasFilters = useMemo(() => {
    return Boolean(
      filters.search.trim() ||
      filters.category_id ||
      filters.status.length ||
      filters.type.length ||
      filters.per_page !== 20
    );
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await postPackages(filters);
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(extractAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">إدارة الباقات</h1>
          <p className="mt-2 text-muted-foreground">عرض وإدارة جميع الباقات المتوفرة</p>
        </div>

        <div className="flex gap-2">
          {hasFilters && (
            <Button variant="outline" onClick={reset} disabled={loading}>
              <FilterX className="ml-2 h-4 w-4" />
              مسح الفلاتر
            </Button>
          )}

          <Button asChild>
            <Link href="/admin/packages/new">
              <Plus className="ml-2 h-4 w-4" />
              إضافة باقة
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters UI */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">بحث (UUID / AR / EN)</div>
              <Input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="ابحث بالاسم أو UUID..."
                className="w-96"
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">نوع الباقة</div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={filters.type.includes("hourly") ? "default" : "outline"}
                  onClick={() => setFilters((f) => ({ ...f, type: toggle(f.type, "hourly") }))}
                >
                  ساعات
                </Button>
                <Button
                  type="button"
                  variant={filters.type.includes("monthly") ? "default" : "outline"}
                  onClick={() => setFilters((f) => ({ ...f, type: toggle(f.type, "monthly") }))}
                >
                  شهري
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">الحالة</div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={filters.status.includes("active") ? "default" : "outline"}
                  onClick={() => setFilters((f) => ({ ...f, status: toggle(f.status, "active") }))}
                >
                  نشط
                </Button>
                <Button
                  type="button"
                  variant={filters.status.includes("inactive") ? "default" : "outline"}
                  onClick={() => setFilters((f) => ({ ...f, status: toggle(f.status, "inactive") }))}
                >
                  معطل
                </Button>
              </div>
            </div>

            {/* Per Page */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Per Page</div>
              <Input
                type="number"
                min={1}
                max={100}
                value={String(filters.per_page)}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    per_page: Math.max(1, Math.min(100, Number(e.target.value || 20))),
                  }))
                }
                className="w-28"
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button type="button" onClick={load} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحميل
                  </>
                ) : (
                  <>
                    <Search className="ml-2 h-4 w-4" />
                    بحث
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={loading || !hasFilters}
              >
                <FilterX className="ml-2 h-4 w-4" />
                مسح
              </Button>

              {hasFilters && <Badge variant="secondary">فلاتر مفعلة</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive whitespace-pre-wrap">
            {error}
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">عدد الباقات</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpi.packages}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">إجمالي البطاقات</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpi.cards_total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">متوفرة</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{kpi.cards_available}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">محجوزة</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{kpi.cards_reserved}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">مباعة</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{kpi.cards_sold}</div></CardContent>
        </Card>
      </div>

      {/* Loader */}
      {loading && (
        <Card>
          <CardContent className="py-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            جاري جلب البيانات...
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {!loading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {pkg.category_type === "hourly" || pkg.category_type === "monthly"
                        ? iconByType(pkg.category_type)
                        : <PackageIcon className="h-5 w-5 text-primary" />
                      }
                    </div>
                    <Badge variant={pkg.is_active ? "default" : "secondary"}>
                      {pkg.is_active ? "نشط" : "معطل"}
                    </Badge>
                  </div>

                  <CardTitle className="mt-3 leading-snug">{pkg.name_ar}</CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {pkg.description || "—"}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border p-2">
                      <div className="text-muted-foreground">الفئة</div>
                      <div className="font-medium">{pkg.category_name_ar}</div>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="text-muted-foreground">المدة</div>
                      <div className="font-medium">{pkg.duration}</div>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="text-muted-foreground">السعر</div>
                      <div className="font-bold text-primary">₪ {pkg.price}</div>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="text-muted-foreground">إجمالي البطاقات</div>
                      <div className="font-medium">{pkg.counts.total}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">متوفرة: {pkg.counts.available}</Badge>
                    <Badge variant="secondary">محجوزة: {pkg.counts.reserved}</Badge>
                    <Badge variant="secondary">مباعة: {pkg.counts.sold}</Badge>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                      <Link href={`/admin/packages/${pkg.id}`}>تفاصيل</Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/admin/packages/${pkg.id}/edit`}>تعديل</Link>
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    UUID: <span className="font-mono">{pkg.uuid}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {rows.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PackageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">لا توجد باقات مطابقة للبحث/الفلاتر الحالية</p>
                <Button asChild>
                  <Link href="/admin/packages/new">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة باقة جديدة
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
