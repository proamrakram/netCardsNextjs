import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { PackageCard } from "@/components/package-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type CatalogPackage = {
  id: number | string;
  name?: string;
  name_ar: string;
  description?: string | null;
  duration: string;
  price: string | number;
  is_active: boolean;
  available_count: number;
  category?: {
    id: number | string;
    name?: string;
    name_ar: string;
    type: "hourly" | "monthly";
  };
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export default async function HomePage() {
  let packagesWithCount: CatalogPackage[] = [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">الباقات المميزة</h2>
                <p className="mt-2 text-muted-foreground">اختر الباقة المناسبة لاحتياجاتك</p>
              </div>

              <Button variant="outline" asChild>
                <Link href="/packages">
                  عرض الكل
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packagesWithCount.map((pkg) => (
                <PackageCard key={String(pkg.id)} pkg={pkg} />
              ))}
            </div>

            {packagesWithCount.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <p>لا توجد باقات متوفرة حالياً</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
