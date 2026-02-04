"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PackageCard } from "@/components/package-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Search, RefreshCw } from "lucide-react";
import { axiosBrowser } from "@/lib/axios/browser";

type PackageItem = {
  id: string | number;
  name_ar?: string;
  description?: string | null;
  duration?: string;
  price?: string;
  type?: "hourly" | "monthly";
  cards_counts?: { available?: number };
};

function pickItems(resp: any): PackageItem[] {
  return resp?.data?.data?.items ?? [];
}

export default function PackagesPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const defaultTab = sp.get("type") === "monthly" ? "monthly" : "hourly";

  const [tab, setTab] = useState<"hourly" | "monthly">(defaultTab);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [hourly, setHourly] = useState<PackageItem[]>([]);
  const [monthly, setMonthly] = useState<PackageItem[]>([]);

  const filteredHourly = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hourly;
    return hourly.filter((p) => (p.name_ar || "").toLowerCase().includes(q));
  }, [hourly, search]);

  const filteredMonthly = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return monthly;
    return monthly.filter((p) => (p.name_ar || "").toLowerCase().includes(q));
  }, [monthly, search]);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      // auth check سريع
      await axiosBrowser.get("/api/store/me");

      const [h, m] = await Promise.all([
        axiosBrowser.post("/api/store/packages", { type: "hourly", per_page: 50, search: "" }),
        axiosBrowser.post("/api/store/packages", { type: "monthly", per_page: 50, search: "" }),
      ]);

      const hourlyItems = pickItems(h).filter((p: PackageItem) => (p.cards_counts?.available ?? 0) > 0);
      const monthlyItems = pickItems(m).filter((p: PackageItem) => (p.cards_counts?.available ?? 0) > 0);

      setHourly(hourlyItems);
      setMonthly(monthlyItems);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        router.push(`/auth/login?redirect=/packages`);
        return;
      }
      setErr(e?.response?.data?.message || "حدث خطأ أثناء تحميل الباقات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold">جميع الباقات</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              اختر باقة مناسبة — المتوفر فقط يظهر هنا
            </p>

            <div className="mx-auto mt-6 flex max-w-xl items-center gap-2">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث باسم الباقة..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="bg-transparent" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4">
            {err && (
              <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {err}
              </div>
            )}

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="hourly" className="gap-2">
                  <Clock className="h-4 w-4" /> باقات الساعات
                </TabsTrigger>
                <TabsTrigger value="monthly" className="gap-2">
                  <Calendar className="h-4 w-4" /> الاشتراكات الشهرية
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hourly">
                {loading ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-44 rounded-xl border bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredHourly.map((pkg) => (
                        <PackageCard key={String(pkg.id)} pkg={pkg as any} />
                      ))}
                    </div>
                    {filteredHourly.length === 0 && (
                      <div className="py-12 text-center text-muted-foreground">
                        لا توجد باقات ساعات متوفرة
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="monthly">
                {loading ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-44 rounded-xl border bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredMonthly.map((pkg) => (
                        <PackageCard key={String(pkg.id)} pkg={pkg as any} />
                      ))}
                    </div>
                    {filteredMonthly.length === 0 && (
                      <div className="py-12 text-center text-muted-foreground">
                        لا توجد اشتراكات شهرية متوفرة
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
