"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CheckoutForm } from "@/components/checkout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Wifi, Shield, Loader2 } from "lucide-react";
import { axiosBrowser } from "@/lib/axios/browser";

type PackageDTO = {
  id: string | number;
  name_ar: string;
  description?: string | null;
  duration: string;
  price: string;
  type: "hourly" | "monthly";
  cards_counts?: { available?: number };
  category?: { type?: "hourly" | "monthly" };
};

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams<{ packageId: string }>();
  const packageId = params.packageId;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pkg, setPkg] = useState<PackageDTO | null>(null);

  const availableCount = pkg?.cards_counts?.available ?? 0;
  const isHourly = useMemo(() => (pkg?.type ?? pkg?.category?.type) === "hourly", [pkg]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        await axiosBrowser.get("/api/store/me");

        const res = await axiosBrowser.get(`/api/store/packages/${packageId}`);
        const item = res.data?.data?.item ?? res.data?.data?.package ?? res.data?.data?.data?.item;

        // حسب response عندك: data.item
        if (!item) {
          router.push("/packages");
          return;
        }

        // ensure available
        const count = item?.cards_counts?.available ?? 0;
        if (count <= 0) {
          router.push("/packages");
          return;
        }

        setPkg(item);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          router.push(`/auth/login?redirect=/checkout/${packageId}`);
          return;
        }
        setErr(e?.response?.data?.message || "حدث خطأ أثناء تحميل بيانات الباقة");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [packageId, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-8 text-center text-3xl font-bold">إتمام الشراء</h1>

            {err && (
              <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {err}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isHourly ? <Clock className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                    تفاصيل الباقة
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {loading || !pkg ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جارٍ التحميل...
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">{pkg.name_ar}</h3>
                          <p className="text-sm text-muted-foreground">{pkg.description || ""}</p>
                        </div>
                        <Badge>{isHourly ? "باقة ساعات" : "اشتراك شهري"}</Badge>
                      </div>

                      <div className="space-y-2 rounded-lg bg-muted p-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Wifi className="h-4 w-4" />
                            المدة
                          </span>
                          <span className="font-medium">{pkg.duration}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            المتوفر
                          </span>
                          <span className="font-medium text-green-600">{availableCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-4">
                        <span className="text-lg font-medium">السعر الإجمالي</span>
                        <span className="text-2xl font-bold text-primary">{pkg.price} ر.س</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <CheckoutForm packageId={packageId} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
