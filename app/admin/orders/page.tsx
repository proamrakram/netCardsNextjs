"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  RefreshCw,
  SlidersHorizontal,
  FilterX,
  CalendarDays,
  CreditCard,
  CircleCheck,
  CircleX,
  Clock,
  User,
  Package as PackageIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import OrdersFilters from "@/components/admin/orders/orders-filters";
import { OrderActions } from "@/components/admin/orders/order-actions";
import { axiosBrowser } from "@/lib/axios/browser";

type OrderStatus = "pending" | "confirmed" | "cancelled";
type PaymentMethod = "BOP" | "cash" | "palpay";

type PackageDTO = { id: string | number; name_ar: string };

type OrderRow = {
  id: string | number;
  uuid: string;

  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_proof_url?: string | null;

  quantity?: number;
  total_price: string | number;
  notes?: string | null;

  user_id?: string | number | null;
  package_id?: string | number | null;
  card_id?: string | number | null;

  created_at?: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;

  user?: { id?: string; full_name?: string; phone?: string } | null;
  package?: { id?: string; name_ar?: string; price?: string } | null;
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
  data?: {
    items?: OrderRow[];
    meta?: PaginationMeta;
    packages?: PackageDTO[];
  };
  errors?: Record<string, string[]>;
};


function statusLabel(s: OrderStatus) {
  if (s === "pending") return "قيد الانتظار";
  if (s === "confirmed") return "مؤكد";
  return "ملغي";
}

function statusVariant(s: OrderStatus) {
  if (s === "pending") return "secondary";
  if (s === "confirmed") return "default";
  return "destructive";
}

function paymentLabel(p: PaymentMethod) {
  if (p === "BOP") return "BOP";
  if (p === "cash") return "Cash";
  return "PalPay";
}

function paymentVariant(p: PaymentMethod) {
  if (p === "cash") return "secondary";
  if (p === "palpay") return "outline";
  return "default";
}

function formatILS(v: string | number) {
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return ` ${v} ₪ `;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type FiltersState = {
  search: string;
  status: "" | OrderStatus;
  payment_method: "" | PaymentMethod;
  user_id: string;
  package_id: string;
  from: string;
  to: string;
  page: number;
  per_page: number;
};

function firstError(err: any) {
  const data = err?.response?.data;
  const fieldErrors = data?.errors;

  if (fieldErrors && typeof fieldErrors === "object") {
    const firstKey = Object.keys(fieldErrors)[0];
    const msg = Array.isArray(fieldErrors[firstKey]) ? fieldErrors[firstKey][0] : null;
    if (msg) return msg;
  }

  return data?.message || err?.message || "تعذر الاتصال بالسيرفر";
}

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    status: "",
    payment_method: "",
    user_id: "",
    package_id: "",
    from: "",
    to: "",
    page: 1,
    per_page: 20,
  });

  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<ApiResponse | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const items = payload?.data?.items ?? [];
  const meta = payload?.data?.meta;
  const packages = payload?.data?.packages ?? [];

  const pending = useMemo(() => items.filter((o) => o.status === "pending").length, [items]);
  const confirmed = useMemo(() => items.filter((o) => o.status === "confirmed").length, [items]);
  const cancelled = useMemo(() => items.filter((o) => o.status === "cancelled").length, [items]);

  const activeFiltersCount =
    (filters.status ? 1 : 0) +
    (filters.payment_method ? 1 : 0) +
    (filters.package_id ? 1 : 0) +
    (filters.user_id ? 1 : 0) +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0) +
    (filters.search ? 1 : 0);

  function resetFilters() {
    fetchOrders({
      search: "",
      status: "",
      payment_method: "",
      user_id: "",
      package_id: "",
      from: "",
      to: "",
      page: 1,
      per_page: filters.per_page,
    });
  }

  function applyRangePreset(preset: "today" | "7d" | "30d") {
    const now = new Date();
    const to = isoDate(now);

    let fromDate = new Date(now);
    if (preset === "7d") fromDate.setDate(now.getDate() - 7);
    if (preset === "30d") fromDate.setDate(now.getDate() - 30);

    const from = preset === "today" ? to : isoDate(fromDate);

    fetchOrders({ from, to, page: 1 });
  }

  async function fetchOrders(next?: Partial<FiltersState>) {
    const merged: FiltersState = { ...filters, ...(next ?? {}) };

    const changedNonPaging =
      next && Object.keys(next).some((k) => !["page", "per_page"].includes(k));

    if (changedNonPaging) merged.page = 1;

    setFilters(merged);
    setLoading(true);

    try {
      // ✅ المسار الصحيح حسب ملف BFF:
      // app/api/admin/orders/route.ts
      const res = await axiosBrowser.post<ApiResponse>("/api/admin/orders", merged);

      setPayload(res.data);
    } catch (err: any) {
      setPayload({ success: false, message: firstError(err) });
    } finally {
      setLoading(false);
    }
  }

  function reload() {
    fetchOrders(); // رح تستخدم filters الحالية
  }


  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 p-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="mt-2 text-muted-foreground">عرض وإدارة جميع طلبات العملاء</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="bg-transparent"
            onClick={() => fetchOrders()}
            disabled={loading}
            title="تحديث"
          >
            <RefreshCw className={`ml-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>

          <Button
            variant="outline"
            className="bg-transparent"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal className="ml-2 h-4 w-4" />
            فلاتر
            {activeFiltersCount > 0 && (
              <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-2 text-xs text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Filters Bar (chips) */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={!filters.status ? "default" : "outline"}
                className={!filters.status ? "" : "bg-transparent"}
                onClick={() => fetchOrders({ status: "", page: 1 })}
              >
                الكل
              </Button>

              <Button
                variant={filters.status === "pending" ? "default" : "outline"}
                className={filters.status === "pending" ? "" : "bg-transparent"}
                onClick={() => fetchOrders({ status: "pending", page: 1 })}
              >
                <Clock className="ml-2 h-4 w-4" />
                قيد الانتظار
              </Button>

              <Button
                variant={filters.status === "confirmed" ? "default" : "outline"}
                className={filters.status === "confirmed" ? "" : "bg-transparent"}
                onClick={() => fetchOrders({ status: "confirmed", page: 1 })}
              >
                <CircleCheck className="ml-2 h-4 w-4" />
                مؤكدة
              </Button>

              <Button
                variant={filters.status === "cancelled" ? "default" : "outline"}
                className={filters.status === "cancelled" ? "" : "bg-transparent"}
                onClick={() => fetchOrders({ status: "cancelled", page: 1 })}
              >
                <CircleX className="ml-2 h-4 w-4" />
                ملغاة
              </Button>

              {activeFiltersCount > 0 && (
                <Button variant="outline" className="bg-transparent" onClick={resetFilters}>
                  <FilterX className="ml-2 h-4 w-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => applyRangePreset("today")}
              >
                <CalendarDays className="ml-2 h-4 w-4" />
                اليوم
              </Button>
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => applyRangePreset("7d")}
              >
                آخر 7 أيام
              </Button>
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => applyRangePreset("30d")}
              >
                آخر 30 يوم
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters (collapsible) */}
      {filtersOpen && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">فلاتر متقدمة</CardTitle>
            <CardDescription>فلترة حسب الدفع/الباقة/العميل والتواريخ</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                بحث
              </Label>
              <Input
                value={filters.search}
                placeholder="UUID أو ملاحظات..."
                onChange={(e) => fetchOrders({ search: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                طريقة الدفع
              </Label>
              <Select
                value={filters.payment_method || "all"}
                onValueChange={(v) =>
                  fetchOrders({ payment_method: v === "all" ? "" : (v as any) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="BOP">BOP</SelectItem>
                  <SelectItem value="cash">cash</SelectItem>
                  <SelectItem value="palpay">palpay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <PackageIcon className="h-4 w-4 text-muted-foreground" />
                الباقة
              </Label>
              <Select
                value={filters.package_id || "all"}
                onValueChange={(v) => fetchOrders({ package_id: v === "all" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الباقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {packages.map((p) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>
                      {p.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                رقم العميل (ID)
              </Label>
              <Input
                value={filters.user_id}
                placeholder="مثال: 12"
                onChange={(e) => fetchOrders({ user_id: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 grid gap-2">
              <Label>من / إلى</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filters.from}
                  onChange={(e) => fetchOrders({ from: e.target.value })}
                />
                <Input
                  type="date"
                  value={filters.to}
                  onChange={(e) => fetchOrders({ to: e.target.value })}
                />
              </div>
            </div>

            <div className="md:col-span-2 grid gap-2">
              <Label>لكل صفحة</Label>
              <Select
                value={String(filters.per_page)}
                onValueChange={(v) => fetchOrders({ per_page: Number(v), page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden">
              <OrdersFilters
                packages={packages}
                value={filters as any}
                onChange={() => { }}
                loading={loading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Counters */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">مؤكدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ملغاة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              قائمة الطلبات
            </CardTitle>
            <CardDescription className="mt-1">
              {meta ? `صفحة ${meta.current_page} / ${meta.total_pages} — الإجمالي ${meta.total_items}` : "—"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">ID</TableHead>
                    <TableHead className="text-center">العميل</TableHead>
                    <TableHead className="text-center">الباقة</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">الدفع</TableHead>
                    <TableHead className="text-center">الإجمالي</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {items.map((order) => (
                    <TableRow key={String(order.id)} className="hover:bg-muted/40">
                      <TableCell className="text-center">
                        <code className="rounded bg-muted px-2 py-1 text-xs">{order.id}</code>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-0.5">
                          <div className="font-medium">{order.user?.full_name || "غير معروف"}</div>
                          <div className="text-xs text-muted-foreground">{order.user?.phone || "-"}</div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-0.5">
                          <div className="font-medium">{order.package?.name_ar || "-"}</div>
                          {order.package?.price ? (
                            <div className="text-xs text-muted-foreground">{formatILS(order.package.price)}</div>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-medium">
                        {typeof order.quantity === "number" ? order.quantity : "—"}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={paymentVariant(order.payment_method)}>
                            {paymentLabel(order.payment_method)}
                          </Badge>
                          {order.payment_proof_url ? (
                            <a
                              className="text-xs text-primary underline underline-offset-4"
                              href={order.payment_proof_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              إثبات الدفع
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-semibold">
                        {formatILS(order.total_price)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                      </TableCell>

                      <TableCell className="text-center text-muted-foreground">
                        {order.created_at ? new Date(order.created_at).toLocaleString("ar-SA") : "-"}
                      </TableCell>

                      <TableCell className="text-center">
                        <OrderActions order={order} onChanged={reload} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="mb-4 h-12 w-12" />
              <p>{loading ? "جاري التحميل..." : payload?.message || "لا توجد طلبات"}</p>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                className="bg-transparent"
                disabled={loading || meta.current_page <= 1}
                onClick={() => fetchOrders({ page: (meta.current_page ?? filters.page) - 1 })}
              >
                السابق
              </Button>

              <div className="text-sm text-muted-foreground">
                صفحة <span className="font-medium text-foreground">{meta.current_page}</span> من{" "}
                <span className="font-medium text-foreground">{meta.total_pages}</span>
              </div>

              <Button
                variant="outline"
                className="bg-transparent"
                disabled={loading || meta.current_page >= meta.total_pages}
                onClick={() => fetchOrders({ page: (meta.current_page ?? filters.page) + 1 })}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
