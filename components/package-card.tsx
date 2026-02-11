"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Wifi } from "lucide-react";
import Link from "next/link";

type PackageDTO = {
  id: number | string;
  name_ar: string;
  description?: string | null;
  duration: string;
  price: string | number;
  available_count?: number;
  category?: {
    type: "hourly" | "monthly";
  } | null;
};

interface PackageCardProps {
  pkg: PackageDTO;
}

function formatILS(value: string | number) {
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (Number.isFinite(n)) {
    // عملة شيكل (₪) مع تنسيق عربي مناسب لفلسطين
    return new Intl.NumberFormat("ar-PS", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  // fallback لو السعر نص غير قابل للتحويل لرقم
  return `${value} ₪`;
}

export function PackageCard({ pkg }: PackageCardProps) {
  const isHourly = pkg.category?.type === "hourly";
  const availableCount = pkg.available_count || 0;

  return (
    <Card dir="rtl" className="relative overflow-hidden transition-all hover:shadow-lg text-right">
      <div className="absolute top-0 right-0 left-0 h-1 bg-primary" />

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            {isHourly ? (
              <Clock className="h-6 w-6 text-primary" />
            ) : (
              <Calendar className="h-6 w-6 text-primary" />
            )}
          </div>

          <Badge variant={availableCount > 0 ? "default" : "secondary"}>
            {availableCount > 0 ? `${availableCount} متوفر` : "غير متوفر"}
          </Badge>
        </div>

        <h3 className="mt-4 text-xl font-bold text-right">{pkg.name_ar}</h3>
        <p className="text-sm text-muted-foreground text-right">{pkg.description || ""}</p>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground justify-start">
          <Wifi className="h-4 w-4" />
          <span className="text-sm">{pkg.duration}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="text-2xl font-bold text-primary">{formatILS(pkg.price)}</div>

        <Button disabled={availableCount === 0} asChild={availableCount > 0}>
          {availableCount > 0 ? (
            <Link href={`/checkout/${pkg.id}`}>شراء الآن</Link>
          ) : (
            <span>غير متوفر</span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
