"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { axiosBrowser } from "@/lib/axios/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link as LinkIcon, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function CheckoutForm({ packageId }: { packageId: string | number }) {
  const router = useRouter();

  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setErr(null);

    try {
      await axiosBrowser.post("/api/store/orders", {
        package_id: Number(packageId),
        payment_method: "BOP",
        payment_proof_url: paymentProofUrl.trim() || null,
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
    <div className="rounded-xl border bg-background p-5">
      <h3 className="mb-4 text-lg font-semibold">معلومات الدفع</h3>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>رابط إثبات الدفع (اختياري)</Label>
          <div className="relative">
            <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              dir="ltr"
              className="pl-10 text-left"
              placeholder="https://example.com/payment-proof.jpg"
              value={paymentProofUrl}
              onChange={(e) => setPaymentProofUrl(e.target.value)}
            />
          </div>
        </div>

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

        {err && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

        <Button className="w-full" onClick={submit} disabled={loading}>
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
