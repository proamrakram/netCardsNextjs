"use client";

// app/admin/orders/page.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, RefreshCw } from "lucide-react";
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

type OrderStatus = "pending" | "confirmed" | "cancelled";
type PaymentMethod = "BOP" | "cash" | "palpay";

type PackageDTO = { id: string | number; name_ar: string };

type OrderRow = {
  id: string | number;
  uuid: string;

  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_proof_url?: string | null;

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

type FiltersState = {
  search: string;
  status: "" | OrderStatus;
  payment_method: "" | PaymentMethod;
  user_id: string;
  package_id: string;
  page: number;
  per_page: number;
};

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    status: "",
    payment_method: "",
    user_id: "",
    package_id: "",
    page: 1,
    per_page: 20,
  });

  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<ApiResponse | null>(null);

  const items = payload?.data?.items ?? [];
  const meta = payload?.data?.meta;
  const packages = payload?.data?.packages ?? [];

  const pending = useMemo(() => items.filter((o) => o.status === "pending").length, [items]);
  const confirmed = useMemo(() => items.filter((o) => o.status === "confirmed").length, [items]);
  const cancelled = useMemo(() => items.filter((o) => o.status === "cancelled").length, [items]);

  async function fetchOrders(next?: Partial<FiltersState>) {
    const merged: FiltersState = { ...filters, ...(next ?? {}) };

    // أي تغيير على الفلاتر (غير page/per_page) يرجّع الصفحة 1 تلقائيًا
    const changedNonPaging =
      next &&
      Object.keys(next).some((k) => !["page", "per_page"].includes(k));

    if (changedNonPaging) {
      merged.page = 1;
    }

    setFilters(merged);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/orders/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
        cache: "no-store",
      });

      const data = (await res.json()) as ApiResponse;
      setPayload(data);
    } catch (e) {
      setPayload({
        success: false,
        message: "تعذر الاتصال بالسيرفر",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // أول تحميل
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="mt-2 text-muted-foreground">عرض وإدارة جميع طلبات العملاء</p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchOrders()}
          disabled={loading}
        >
          <RefreshCw className="ml-2 h-4 w-4" />
          {loading ? "جاري التحديث..." : "تحديث"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            البحث والفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* لازم تعدّل OrdersFilters ليشتغل على state بدل searchParams */}
          <OrdersFilters
            packages={packages}
            value={filters}
            onChange={(next) => fetchOrders(next)}
            loading={loading}
          />
        </CardContent>
      </Card>

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            قائمة الطلبات
          </CardTitle>

          {meta && (
            <div className="text-sm text-muted-foreground">
              صفحة {meta.current_page} / {meta.total_pages} — الإجمالي {meta.total_items}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">UUID</TableHead>
                    <TableHead className="text-center">العميل</TableHead>
                    <TableHead className="text-center">الباقة</TableHead>
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
                        <code className="rounded bg-muted px-2 py-1 text-xs">{order.uuid}</code>
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
                            <div className="text-xs text-muted-foreground">₪ {order.package.price}</div>
                          ) : null}
                        </div>
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
                        ₪ {order.total_price}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant={statusVariant(order.status)}>
                          {statusLabel(order.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center text-muted-foreground">
                        {order.created_at ? new Date(order.created_at).toLocaleString("ar-SA") : "-"}
                      </TableCell>

                      <TableCell className="text-center">
                        <OrderActions order={order} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="mb-4 h-12 w-12" />
              <p>{loading ? "جاري التحميل..." : "لا توجد طلبات"}</p>
            </div>
          )}

          {/* Pagination (بدون Query، كله state) */}
          {meta && meta.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={loading || meta.current_page <= 1}
                onClick={() => fetchOrders({ page: (meta.current_page ?? filters.page) - 1 })}
              >
                السابق
              </Button>

              <Button
                variant="outline"
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
