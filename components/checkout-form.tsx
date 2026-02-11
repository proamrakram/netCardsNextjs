// components/checkout-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { axiosBrowser } from "@/lib/axios/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, StickyNote, ReceiptText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatILS(value: number) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ar-PS", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function CheckoutForm({
  packageId,
  unitPrice,
}: {
  packageId: string | number;
  unitPrice: string | number;
}) {
  const router = useRouter();

  const [quantity, setQuantity] = useState<string>("1");
  const [paymentMethod, setPaymentMethod] = useState<"BOP" | "cash" | "palpay">("BOP");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qtyNum = useMemo(() => {
    const n = Number(quantity);
    if (!Number.isFinite(n) || n < 1) return 0;
    return Math.floor(n);
  }, [quantity]);

  const priceNum = useMemo(() => {
    const n = typeof unitPrice === "number" ? unitPrice : Number(String(unitPrice).trim());
    return Number.isFinite(n) ? n : 0;
  }, [unitPrice]);

  const total = useMemo(() => {
    return Math.round(priceNum * qtyNum * 100) / 100;
  }, [priceNum, qtyNum]);

  async function submit() {
    setLoading(true);
    setErr(null);

    try {
      if (qtyNum < 1) {
        setErr("الكمية مطلوبة ويجب أن تكون 1 أو أكثر");
        return;
      }

      await axiosBrowser.post("/api/checkout", {
        package_id: Number(packageId),
        quantity: qtyNum, // ✅ مهم: رقم صحيح
        amount: total,    // ✅ حسب شروط الباك اند (price * quantity)
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });

      router.push("/checkout/success");
      router.refresh();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.push(`/auth/login?redirect=/checkout/${packageId}`);
        return;
      }
      setErr(e?.response?.data?.message || "فشل إنشاء الطلب");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-background p-5" dir="rtl">
      <h3 className="mb-4 text-lg font-semibold text-right">معلومات الطلب</h3>

      <div className="space-y-4">
        {/* Quantity */}
        <div className="grid gap-2">
          <Label>كمية البطاقات</Label>
          <Input
            type="number"
            min="1"
            step="1"
            placeholder="أدخل الكمية"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        {/* Total */}
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <ReceiptText className="h-4 w-4" />
              الإجمالي
            </span>
            <span className="text-xl font-bold text-primary">{formatILS(total)}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            السعر للوحدة: {formatILS(priceNum)} × الكمية: {qtyNum || 0}
          </div>
        </div>

        {/* Payment Method */}
        <div className="grid gap-2">
          <Label>طريقة الدفع</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOP">بنك فلسطين (BOP)</SelectItem>
              <SelectItem value="cash">كاش</SelectItem>
              <SelectItem value="palpay">PalPay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <Label>ملاحظات (اختياري)</Label>
          <div className="relative">
            <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              className="pl-10"
              rows={4}
              placeholder="أي ملاحظة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {err && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {err}
          </div>
        )}

        <Button className="w-full" onClick={submit} disabled={loading || qtyNum < 1}>
          {loading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جارٍ إنشاء الطلب...
            </>
          ) : (
            "تأكيد الطلب"
          )}
        </Button>
      </div>
    </div>
  );
}
