// app/packages/page.tsx
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
  uuid?: string;
  name?: string;
  name_ar?: string;
  description?: string | null;
  duration?: string;
  price?: string;
  type?: "hourly" | "monthly";
  category?: { type?: "hourly" | "monthly" } | null;
  cards_counts?: { available?: number; total?: number; reserved?: number; sold?: number };
};

type PackagesMeta = {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
};

function pickPayload(resp: any): { items: PackageItem[]; meta: PackagesMeta } {
  const data = resp?.data?.data ?? {};
  return {
    items: data?.items ?? [],
    meta: data?.meta ?? { current_page: 1, per_page: 20, total_items: 0, total_pages: 1 },
  };
}

function mapToCardShape(p: PackageItem) {
  return {
    ...p,
    // PackageCard expects this field (legacy in this frontend)
    available_count: p.cards_counts?.available ?? 0,
    // PackageCard reads category.type to decide icon
    category: p.category ?? { type: p.type },
  };
}

export default function PackagesPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const defaultTab = sp.get("type") === "monthly" ? "monthly" : "hourly";

  const [tab, setTab] = useState<"hourly" | "monthly">(defaultTab);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [meta, setMeta] = useState<PackagesMeta>({
    current_page: 1,
    per_page: 20,
    total_items: 0,
    total_pages: 1,
  });

  const [hourly, setHourly] = useState<PackageItem[]>([]);
  const [monthly, setMonthly] = useState<PackageItem[]>([]);

  // فلترة بسيطة للعرض فقط (تظل backend هي المصدر الأساسي للبحث)
  const filteredHourly = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hourly;
    return hourly.filter((p) =>
      `${p.uuid ?? ""} ${(p.name ?? "")} ${(p.name_ar ?? "")}`.toLowerCase().includes(q)
    );
  }, [hourly, search]);

  const filteredMonthly = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return monthly;
    return monthly.filter((p) =>
      `${p.uuid ?? ""} ${(p.name ?? "")} ${(p.name_ar ?? "")}`.toLowerCase().includes(q)
    );
  }, [monthly, search]);

  async function load(next?: { tab?: "hourly" | "monthly"; page?: number }) {
    setLoading(true);
    setErr(null);

    try {
      const activeTab = next?.tab ?? tab;
      const activePage = next?.page ?? page;

      const res = await axiosBrowser.post("/bff/packages", {
        search: search,
        category_id: null,
        type: [activeTab],
        per_page: perPage,
        page: activePage,
      });

      const payload = pickPayload(res);
      const items = payload.items ?? [];

      if (activeTab === "hourly") setHourly(items);
      else setMonthly(items);

      setMeta(payload.meta);
      setPage(payload.meta.current_page);
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

  // عند تغيير التبويب: صفّر الصفحة واطلب من جديد
  useEffect(() => {
    setPage(1);
    load({ tab, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-10">
          <div className="container mx-auto px-4 text-center text-right">
            <h1 className="text-4xl font-bold">جميع الباقات</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              اختر باقة مناسبة — المتوفر فقط يظهر هنا
            </p>

            <div className="mx-auto mt-6 flex max-w-xl items-center gap-2">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو UUID..."
                  className="pr-10"
                />
              </div>

              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => load({ page: 1 })}
                disabled={loading}
                title="تحديث"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              النتائج: <span className="font-medium text-foreground">{meta.total_items}</span>
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
                        <PackageCard key={String(pkg.id)} pkg={mapToCardShape(pkg) as any} />
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
                        <PackageCard key={String(pkg.id)} pkg={mapToCardShape(pkg) as any} />
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

            {!loading && meta.total_pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  className="bg-transparent"
                  disabled={page <= 1}
                  onClick={() => load({ page: Math.max(1, page - 1) })}
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
                  disabled={page >= meta.total_pages}
                  onClick={() => load({ page: Math.min(meta.total_pages, page + 1) })}
                >
                  التالي
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
