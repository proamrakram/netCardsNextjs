"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package as PackageIcon, Clock, Copy, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { axiosBrowser } from "@/lib/axios/browser";

type OrderItem = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  total_price: string | number;
  created_at?: string;
  package?: { id: string; name_ar?: string; duration?: string };
  card?: { id: string; username?: string; password?: string };
};

export default function DashboardPage() {
  const router = useRouter();

  const [meName, setMeName] = useState<string>("عميلنا العزيز");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showPassFor, setShowPassFor] = useState<Record<string, boolean>>({});

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const confirmedOrders = useMemo(() => orders.filter((o) => o.status === "confirmed"), [orders]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const me = await axiosBrowser.get("/api/store/me");
        setMeName(me.data?.data?.user?.full_name || "عميلنا العزيز");

        const ord = await axiosBrowser.get("/api/store/orders/my");
        const list = ord.data?.data?.items ?? ord.data?.data ?? [];
        setOrders(list);
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

    load();
  }, [router]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">مرحباً، {meName}</h1>
            <p className="mt-2 text-muted-foreground">إدارة طلباتك وبطاقاتك من هنا</p>
          </div>

          {err && (
            <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {err}
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : pendingOrders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">مؤكدة</CardTitle>
                <PackageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : confirmedOrders.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> طلبات قيد الانتظار
                </CardTitle>
                <CardDescription>طلبات بانتظار المراجعة</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 rounded-xl border bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : pendingOrders.length > 0 ? (
                  <div className="space-y-4">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{order.package?.name_ar || "باقة"}</p>
                          <p className="text-sm text-muted-foreground">{order.package?.duration || ""}</p>
                          <p className="text-sm font-medium text-primary">{order.total_price} ر.س</p>
                        </div>
                        <Badge variant="secondary">قيد الانتظار</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">لا توجد طلبات قيد الانتظار</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5" /> بطاقاتي
                </CardTitle>
                <CardDescription>الطلبات المؤكدة وبطاقاتها</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-28 rounded-xl border bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : confirmedOrders.length > 0 ? (
                  <div className="space-y-4">
                    {confirmedOrders.map((order) => {
                      const show = !!showPassFor[order.id];
                      return (
                        <div key={order.id} className="rounded-lg border p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="font-medium">{order.package?.name_ar || "باقة"}</p>
                            <Badge>مؤكد</Badge>
                          </div>

                          {order.card ? (
                            <div className="space-y-2 rounded-lg bg-muted p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-muted-foreground">اسم المستخدم:</span>
                                <div className="flex items-center gap-2">
                                  <code className="rounded bg-background px-2 py-1 text-sm">
                                    {order.card.username || "-"}
                                  </code>
                                  {order.card.username && (
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="bg-transparent"
                                      onClick={() => copy(order.card!.username!)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-muted-foreground">كلمة المرور:</span>
                                <div className="flex items-center gap-2">
                                  <code className="rounded bg-background px-2 py-1 text-sm">
                                    {show ? order.card.password || "-" : "••••••••"}
                                  </code>

                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="bg-transparent"
                                    onClick={() =>
                                      setShowPassFor((p) => ({ ...p, [order.id]: !p[order.id] }))
                                    }
                                  >
                                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>

                                  {order.card.password && (
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="bg-transparent"
                                      onClick={() => copy(order.card!.password!)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">لا توجد بطاقة مرتبطة بهذا الطلب.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-4 text-muted-foreground">لا توجد بطاقات مؤكدة</p>
                    <Button asChild>
                      <Link href="/packages">تصفح الباقات</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
