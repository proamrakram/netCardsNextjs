import { redirect } from "next/navigation";
import { laravelServerFetch } from "@/lib/laravel/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  CreditCard,
  ShoppingCart,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  PieChart,
} from "lucide-react";

type MeResponse = {
  success: boolean;
  message: string;
  data?: {
    user?: {
      id: string;
      full_name?: string;
      email?: string;
      role?: string;
      roles?: string[];
      permissions?: string[];
    };
  };
};

type OverviewResponse = {
  success: boolean;
  message: string;
  data?: {
    orders?: {
      total?: number;
      pending?: number;
      confirmed?: number;
      cancelled?: number;
    };
    cards?: {
      total?: number;
      available?: number;
      reserved?: number;
      sold?: number;
    };
    revenue?: {
      total_confirmed?: string; // Laravel casts to string
    };
    users?: {
      total?: number;
      new_last_7_days?: number;
    };
  };
};

type CardsStatusResponse = {
  success: boolean;
  message: string;
  data?: {
    available?: number;
    reserved?: number;
    sold?: number;
  };
};

type OrdersTimeseriesResponse = {
  success: boolean;
  message: string;
  data?: {
    range?: { days?: number; from?: string; to?: string };
    labels?: string[];
    orders?: number[];
    revenue_confirmed?: string[]; // strings
  };
};

type LatestOrdersResponse = {
  success: boolean;
  message: string;
  data?: {
    items?: Array<{
      id: string;
      status: "pending" | "confirmed" | "cancelled";
      total_price: string;
      payment_method?: "BOP" | "cash" | "palpay" | string;
      created_at?: string; // "Y-m-d H:i"
      confirmed_at?: string | null;
      user?: { id: string; full_name?: string; email?: string } | null;
      package?:
      | {
        id: string;
        name?: string;
        name_ar?: string;
        duration?: string;
        price?: string;
      }
      | null;
      card?: { id: string; status?: string } | null;
    }>;
  };
};

type PackagesInventoryResponse = {
  success: boolean;
  message: string;
  data?: {
    items?: Array<{
      package: {
        id: string;
        name?: string;
        name_ar?: string;
        duration?: string;
        price?: string;
        status?: string;
      };
      inventory: {
        available: number;
        reserved: number;
        sold: number;
      };
    }>;
  };
};

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function formatMoneySAR(v: string | number | undefined | null) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "0.00 ₪";
  return `${n.toFixed(2)} ₪`;
}

function statusBadge(status: "pending" | "confirmed" | "cancelled") {
  return cn(
    "rounded-full px-2 py-1 text-xs font-medium",
    status === "pending" && "bg-yellow-100 text-yellow-800",
    status === "confirmed" && "bg-green-100 text-green-800",
    status === "cancelled" && "bg-red-100 text-red-800"
  );
}

function statusLabel(status: "pending" | "confirmed" | "cancelled") {
  if (status === "pending") return "قيد الانتظار";
  if (status === "confirmed") return "مؤكد";
  return "ملغي";
}

export default async function AdminDashboardPage() {
  // 1) Auth + permission guard (source of truth: /api/auth/me)
  let me: MeResponse;
  try {
    me = (await laravelServerFetch("/api/backend/auth/me")) as MeResponse;
  } catch {
    redirect("/auth/login");
  }

  const roles = me?.data?.user?.roles ?? [];
  const perms = me?.data?.user?.permissions ?? [];

  const isAdmin = roles.includes("admin") || me?.data?.user?.role === "admin";
  const canViewDashboard = perms.includes("view admin dashboard");

  if (!isAdmin) redirect("/dashboard");
  if (!canViewDashboard) redirect("/admin/unauthorized");

  // 2) Fetch dashboard data (match backend exactly)
  // overview + cards-status (GET)
  const overview = (await laravelServerFetch(
    "/api/backend/admin/dashboard/overview"
  )) as OverviewResponse;

  const cardsStatus = (await laravelServerFetch(
    "/api/backend/admin/dashboard/cards-status"
  )) as CardsStatusResponse;

  // latest-orders + orders-timeseries (POST)
  const latestOrders = (await laravelServerFetch(
    "/api/backend/admin/dashboard/latest-orders",
    { method: "POST", data: { limit: 5 } }
  )) as LatestOrdersResponse;

  const timeseries = (await laravelServerFetch(
    "/api/backend/admin/dashboard/orders-timeseries",
    { method: "POST", data: { days: 30 } }
  )) as OrdersTimeseriesResponse;

  // packages-inventory (GET) — optional use
  const packagesInventory = (await laravelServerFetch(
    "/api/backend/admin/dashboard/packages-inventory"
  )) as PackagesInventoryResponse;

  // 3) Normalize values for UI
  const o = overview?.data ?? {};
  const orders = o.orders ?? {};
  const cards = o.cards ?? {};
  const users = o.users ?? {};
  const revenue = o.revenue ?? {};

  const totalRevenue = revenue.total_confirmed ?? "0";
  const confirmedOrders = Number(orders.confirmed ?? 0);
  const pendingOrders = Number(orders.pending ?? 0);
  const cancelledOrders = Number(orders.cancelled ?? 0);
  const totalOrders = Number(orders.total ?? 0);

  const availableCards = Number(cards.available ?? 0);
  const reservedCards = Number(cards.reserved ?? 0);
  const soldCards = Number(cards.sold ?? 0);
  const totalCards = Number(cards.total ?? 0);

  const usersCount = Number(users.total ?? 0);
  const newUsersLast7 = Number(users.new_last_7_days ?? 0);

  const latest = latestOrders?.data?.items ?? [];

  const cardStatus = cardsStatus?.data ?? {
    available: 0,
    reserved: 0,
    sold: 0,
  };

  // conversion rate: confirmed/(confirmed+pending)
  const denom = pendingOrders + confirmedOrders;
  const conversionRate = denom > 0 ? (confirmedOrders / denom) * 100 : 0;

  // (Optional) timeseries ready for chart later
  const tsLabels = timeseries?.data?.labels ?? [];
  const tsOrders = timeseries?.data?.orders ?? [];
  const tsRevenue = timeseries?.data?.revenue_confirmed ?? [];

  // (Optional) packages inventory ready
  const invItems = packagesInventory?.data?.items ?? [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="mt-2 text-muted-foreground">
          نظرة عامة على إحصائيات المتجر
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoneySAR(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              من {confirmedOrders} طلب مؤكد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {cancelledOrders} ملغي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">البطاقات</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCards}</div>
            <p className="text-xs text-muted-foreground">
              {availableCards} متاح • {reservedCards} محجوز • {soldCards} مباع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">طلبات قيد الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">تحتاج تأكيد</p>
          </CardContent>
        </Card>
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              آخر الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latest.length > 0 ? (
              <div className="space-y-4">
                {latest.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {order.package?.name_ar || order.package?.name || "باقة"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.user?.full_name || "عميل"} •{" "}
                        {formatMoneySAR(order.total_price)} •{" "}
                        {order.created_at || "—"}
                      </p>
                    </div>

                    <span className={statusBadge(order.status)}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">لا توجد طلبات</p>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              إحصائيات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Row label="إجمالي العملاء" value={usersCount} icon={<Users className="h-4 w-4" />} />
              <Row
                label="عملاء جدد (آخر 7 أيام)"
                value={newUsersLast7}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <Row
                label="الطلبات المؤكدة"
                value={confirmedOrders}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <Row
                label="طلبات قيد الانتظار"
                value={pendingOrders}
                icon={<Clock className="h-4 w-4" />}
              />
              <Row
                label="معدل التحويل"
                value={`${conversionRate.toFixed(0)}%`}
                icon={<PieChart className="h-4 w-4" />}
              />
            </div>

            {/* Mini block: cards status summary (from /cards-status) */}
            <div className="mt-6 rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">حالة البطاقات</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-muted-foreground">متاح</p>
                  <p className="font-bold">{cardStatus.available ?? 0}</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-muted-foreground">محجوز</p>
                  <p className="font-bold">{cardStatus.reserved ?? 0}</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-muted-foreground">مباع</p>
                  <p className="font-bold">{cardStatus.sold ?? 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optional sections (ready for next step) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Timeseries preview (without charts) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              أداء الطلبات (آخر 30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tsLabels.length > 0 ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>عدد الأيام: {timeseries?.data?.range?.days ?? 30}</p>
                <p>من: {timeseries?.data?.range?.from ?? "—"}</p>
                <p>إلى: {timeseries?.data?.range?.to ?? "—"}</p>

                <div className="mt-4 rounded-lg border p-3">
                  <p className="mb-2 font-medium text-foreground">
                    آخر 5 أيام (معاينة)
                  </p>
                  <div className="space-y-1">
                    {tsLabels.slice(-5).map((d, idx) => {
                      const i = tsLabels.length - 5 + idx;
                      const oc = tsOrders[i] ?? 0;
                      const rv = tsRevenue[i] ?? "0";
                      return (
                        <div key={d} className="flex items-center justify-between">
                          <span>{d}</span>
                          <span className="font-medium text-foreground">
                            {oc} طلب • {formatMoneySAR(rv)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                لا توجد بيانات كافية للرسم البياني
              </p>
            )}
          </CardContent>
        </Card>

        {/* Packages inventory preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              مخزون الباقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invItems.length > 0 ? (
              <div className="space-y-3">
                {invItems.slice(0, 6).map((row) => (
                  <div
                    key={row.package.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {row.package.name_ar || row.package.name || "باقة"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {row.package.duration ?? "—"} • {formatMoneySAR(row.package.price)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          row.package.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {row.package.status === "active" ? "نشط" : "غير نشط"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-muted/40 p-2">
                        <p className="text-muted-foreground">متاح</p>
                        <p className="font-bold text-foreground">
                          {row.inventory.available}
                        </p>
                      </div>
                      <div className="rounded-md bg-muted/40 p-2">
                        <p className="text-muted-foreground">محجوز</p>
                        <p className="font-bold text-foreground">
                          {row.inventory.reserved}
                        </p>
                      </div>
                      <div className="rounded-md bg-muted/40 p-2">
                        <p className="text-muted-foreground">مباع</p>
                        <p className="font-bold text-foreground">
                          {row.inventory.sold}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                لا يوجد مخزون لعرضه
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
