"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
  Package as PackageIcon,
  Clock,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  SlidersHorizontal,
  FilterX,
  CalendarDays,
  CreditCard,
  CircleCheck,
  CircleX,
} from "lucide-react";
import Link from "next/link";
import { axiosBrowser } from "@/lib/axios/browser";

type DashboardOrder = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  payment_method: "BOP" | "cash" | "palpay";
  quantity: number;
  total_price: string;
  created_at?: string;
  package?: {
    id: string;
    name_ar?: string;
    duration?: string;
    price?: string;
    type?: "hourly" | "monthly";
  };
  cards?: Array<{ id?: string; uuid?: string; username?: string | null; password?: string | null }>;
};

type DashboardResp = {
  user: { full_name?: string | null };
  stats: { total: number; pending: number; confirmed: number; cancelled: number };
  orders: {
    items: DashboardOrder[];
    meta: { current_page: number; per_page: number; total_items: number; total_pages: number };
  };
};

function formatILS(v: string | number) {
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return `${v} ₪`;
  return new Intl.NumberFormat("ar-PS", {
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

export default function DashboardPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [meName, setMeName] = useState<string>("عميلنا العزيز");
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [stats, setStats] = useState<DashboardResp["stats"]>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 20,
    total_items: 0,
    total_pages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showPassFor, setShowPassFor] = useState<Record<string, boolean>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const qStatus = sp.get("status") ?? "all";
  const qPay = sp.get("payment_method") ?? "all";
  const qFrom = sp.get("from") ?? "";
  const qTo = sp.get("to") ?? "";
  const qPage = Number(sp.get("page") ?? "1") || 1;

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const confirmedOrders = useMemo(() => orders.filter((o) => o.status === "confirmed"), [orders]);
  const cancelledOrders = useMemo(() => orders.filter((o) => o.status === "cancelled"), [orders]);

  function setQuery(next: Record<string, string | number | null>) {
    const p = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === "" || v === "all") p.delete(k);
      else p.set(k, String(v));
    });
    router.push(`/dashboard?${p.toString()}`);
  }

  function resetFilters() {
    router.push("/dashboard");
  }

  function applyRangePreset(preset: "today" | "7d" | "30d") {
    const now = new Date();
    const to = isoDate(now);

    let fromDate = new Date(now);
    if (preset === "7d") fromDate.setDate(now.getDate() - 7);
    if (preset === "30d") fromDate.setDate(now.getDate() - 30);

    const from = preset === "today" ? to : isoDate(fromDate);
    setQuery({ from, to, page: 1 });
  }

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const res = await axiosBrowser.get("/api/dashboard", {
        params: {
          status: qStatus !== "all" ? qStatus : undefined,
          payment_method: qPay !== "all" ? qPay : undefined,
          from: qFrom || undefined,
          to: qTo || undefined,
          page: qPage,
          per_page: 20,
        },
      });

      const data: DashboardResp = res.data?.data;

      setMeName(data?.user?.full_name || "عميلنا العزيز");
      setStats(data?.stats || { total: 0, pending: 0, confirmed: 0, cancelled: 0 });
      setOrders(data?.orders?.items || []);
      setMeta(
        data?.orders?.meta || { current_page: 1, per_page: 20, total_items: 0, total_pages: 1 }
      );
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }
      setErr(e?.response?.data?.message || "حدث خطأ أثناء تحميل بياناتك");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qStatus, qPay, qFrom, qTo, qPage]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  const activeFiltersCount =
    (qStatus !== "all" ? 1 : 0) +
    (qPay !== "all" ? 1 : 0) +
    (qFrom ? 1 : 0) +
    (qTo ? 1 : 0);

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">مرحباً، {meName}</h1>
              <p className="mt-2 text-muted-foreground">إدارة طلباتك وبطاقاتك من هنا</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => load()}
                disabled={loading}
                title="تحديث"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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

              <Button asChild>
                <Link href="/packages">تصفح الباقات</Link>
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={qStatus === "all" ? "default" : "outline"}
                    className={qStatus === "all" ? "" : "bg-transparent"}
                    onClick={() => setQuery({ status: "all", page: 1 })}
                  >
                    الكل
                  </Button>

                  <Button
                    variant={qStatus === "pending" ? "default" : "outline"}
                    className={qStatus === "pending" ? "" : "bg-transparent"}
                    onClick={() => setQuery({ status: "pending", page: 1 })}
                  >
                    <Clock className="ml-2 h-4 w-4" />
                    قيد الانتظار
                  </Button>

                  <Button
                    variant={qStatus === "confirmed" ? "default" : "outline"}
                    className={qStatus === "confirmed" ? "" : "bg-transparent"}
                    onClick={() => setQuery({ status: "confirmed", page: 1 })}
                  >
                    <PackageIcon className="ml-2 h-4 w-4" />
                    مؤكدة
                  </Button>

                  <Button
                    variant={qStatus === "cancelled" ? "default" : "outline"}
                    className={qStatus === "cancelled" ? "" : "bg-transparent"}
                    onClick={() => setQuery({ status: "cancelled", page: 1 })}
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

          {filtersOpen && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">فلاتر متقدمة</CardTitle>
                <CardDescription>حدد طريقة الدفع والفترة الزمنية</CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    طريقة الدفع
                  </Label>
                  <Select value={qPay} onValueChange={(v) => setQuery({ payment_method: v, page: 1 })}>
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
                  <Label>من</Label>
                  <Input
                    type="date"
                    value={qFrom}
                    onChange={(e) => setQuery({ from: e.target.value, page: 1 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>إلى</Label>
                  <Input
                    type="date"
                    value={qTo}
                    onChange={(e) => setQuery({ to: e.target.value, page: 1 })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {err && (
            <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {err}
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">مؤكدة</CardTitle>
                <CircleCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : stats.confirmed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">ملغاة</CardTitle>
                <CircleX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : stats.cancelled}</div>
              </CardContent>
            </Card>
          </div>

          {/* ✅ 3 Columns in same row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Pending */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5" /> قيد الانتظار
                  </CardTitle>
                  <Badge variant="secondary">{loading ? "—" : pendingOrders.length}</Badge>
                </div>
                <CardDescription>طلبات بانتظار المراجعة</CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 rounded-xl border bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : pendingOrders.length > 0 ? (
                  <div className="max-h-[560px] overflow-y-auto p-4 space-y-3">
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border bg-background p-4 hover:bg-muted/30 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{order.package?.name_ar || "باقة"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{order.package?.duration || ""}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="bg-transparent">
                                الكمية: {order.quantity}
                              </Badge>
                              <span className="text-sm font-semibold text-primary">
                                {formatILS(order.total_price)}
                              </span>
                            </div>
                            {order.created_at ? (
                              <p className="mt-2 text-xs text-muted-foreground">{order.created_at}</p>
                            ) : null}
                          </div>

                          <Badge variant="secondary" className="shrink-0">
                            انتظار
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">لا توجد طلبات قيد الانتظار</div>
                )}
              </CardContent>
            </Card>

            {/* Confirmed */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CircleCheck className="h-5 w-5" /> مؤكدة
                  </CardTitle>
                  <Badge>{loading ? "—" : confirmedOrders.length}</Badge>
                </div>
                <CardDescription>طلبات مؤكدة وبطاقاتها</CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-28 rounded-xl border bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : confirmedOrders.length > 0 ? (
                  <div className="max-h-[560px] overflow-y-auto p-4 space-y-3">
                    {confirmedOrders.map((order) => {
                      const show = !!showPassFor[order.id];
                      const cards = order.cards ?? [];

                      return (
                        <div key={order.id} className="rounded-xl border bg-background p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{order.package?.name_ar || "باقة"}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{order.package?.duration || ""}</p>
                            </div>
                            <Badge className="shrink-0">مؤكد</Badge>
                          </div>

                          <div className="mb-3 text-sm text-muted-foreground">
                            الإجمالي:{" "}
                            <span className="font-medium text-foreground">{formatILS(order.total_price)}</span>{" "}
                            — الكمية:{" "}
                            <span className="font-medium text-foreground">{order.quantity}</span>
                          </div>

                          {cards.length ? (
                            <div className="space-y-3">
                              {cards.map((c, idx) => (
                                <div key={`${order.id}-${idx}`} className="rounded-xl bg-muted p-3">
                                  <div className="mb-2 text-xs text-muted-foreground">
                                    بطاقة #{idx + 1} — UUID:{" "}
                                    <span className="font-medium text-foreground">{c.uuid || "-"}</span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm text-muted-foreground">اسم المستخدم:</span>
                                    <div className="flex items-center gap-2">
                                      <code className="rounded bg-background px-2 py-1 text-sm">
                                        {c.username || "-"}
                                      </code>
                                      {c.username && (
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          className="bg-transparent"
                                          onClick={() => copy(c.username!)}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="text-sm text-muted-foreground">كلمة المرور:</span>
                                    <div className="flex items-center gap-2">
                                      <code className="rounded bg-background px-2 py-1 text-sm">
                                        {show ? c.password || "-" : "••••••••"}
                                      </code>

                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="bg-transparent"
                                        onClick={() =>
                                          setShowPassFor((p) => ({ ...p, [order.id]: !p[order.id] }))
                                        }
                                      >
                                        {show ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>

                                      {c.password && (
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          className="bg-transparent"
                                          onClick={() => copy(c.password!)}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">لا توجد بطاقات ظاهرة لهذا الطلب.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="mb-4 text-muted-foreground">لا توجد طلبات مؤكدة</p>
                    <Button asChild>
                      <Link href="/packages">تصفح الباقات</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cancelled */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CircleX className="h-5 w-5" /> ملغاة
                  </CardTitle>
                  <Badge variant="destructive">{loading ? "—" : cancelledOrders.length}</Badge>
                </div>
                <CardDescription>طلبات تم إلغاؤها</CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 rounded-xl border bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : cancelledOrders.length > 0 ? (
                  <div className="max-h-[560px] overflow-y-auto p-4 space-y-3">
                    {cancelledOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border bg-background p-4 hover:bg-muted/30 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{order.package?.name_ar || "باقة"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{order.package?.duration || ""}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="bg-transparent">
                                الكمية: {order.quantity}
                              </Badge>
                              <span className="text-sm font-semibold text-destructive">
                                {formatILS(order.total_price)}
                              </span>
                            </div>
                            {order.created_at ? (
                              <p className="mt-2 text-xs text-muted-foreground">{order.created_at}</p>
                            ) : null}
                          </div>

                          <Badge variant="destructive" className="shrink-0">
                            ملغي
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">لا توجد طلبات ملغاة</div>
                )}
              </CardContent>
            </Card>
          </div>

          {!loading && meta.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                className="bg-transparent"
                disabled={meta.current_page <= 1}
                onClick={() => setQuery({ page: Math.max(1, meta.current_page - 1) })}
              >
                السابق
              </Button>

              <div className="px-3 text-sm text-muted-foreground">
                صفحة <span className="font-medium text-foreground">{meta.current_page}</span> من{" "}
                <span className="font-medium text-foreground">{meta.total_pages}</span>
              </div>

              <Button
                variant="outline"
                className="bg-transparent"
                disabled={meta.current_page >= meta.total_pages}
                onClick={() => setQuery({ page: Math.min(meta.total_pages, meta.current_page + 1) })}
              >
                التالي
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
