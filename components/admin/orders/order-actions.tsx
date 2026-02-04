// components/admin/order-actions.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosBrowser } from "@/lib/axios/browser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, Loader2, Copy, ExternalLink } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "cancelled";
type PaymentMethod = "BOP" | "cash" | "palpay";

type OrderDTO = {
  id: string | number;
  uuid: string;

  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_proof_url?: string | null;

  total_price: string | number;
  notes?: string | null;

  user_id?: string | number | null;
  package_id?: string | number | null;
  card_id?: string | number | null;

  created_at?: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;

  // لو راجع من Laravel:
  user?: { full_name?: string; phone?: string } | null;
  package?: { name_ar?: string; price?: string } | null;
  card?: { username: string; password: string } | null;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

function statusLabel(s: OrderStatus) {
  if (s === "pending") return "قيد الانتظار";
  if (s === "confirmed") return "مؤكد";
  return "ملغي";
}

function statusVariant(s: OrderStatus) {
  if (s === "pending") return "secondary";
  if (s === "confirmed") return "default";
  return "destructive";
}

function paymentLabel(p: PaymentMethod) {
  if (p === "BOP") return "BOP";
  if (p === "cash") return "Cash";
  return "PalPay";
}

function money(v: string | number) {
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isFinite(n)) return `₪ ${n.toFixed(2)}`;
  return `₪ ${v}`;
}

function firstError(err: any) {
  const data = err?.response?.data;
  const fieldErrors = data?.errors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstKey = Object.keys(fieldErrors)[0];
    const msg = Array.isArray(fieldErrors[firstKey]) ? fieldErrors[firstKey][0] : null;
    if (msg) return msg;
  }
  return data?.message || err?.message || "حدث خطأ غير متوقع";
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function OrderActions({ order }: { order: OrderDTO }) {
  const router = useRouter();

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isPending = order.status === "pending";

  const title = useMemo(() => {
    const pkg = order.package?.name_ar || "—";
    return `طلب: ${pkg}`;
  }, [order.package?.name_ar]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setToast(null);

    try {
      // ✅ هذا يفترض وجود Laravel endpoint لتأكيد الطلب
      // غيّر المسار حسب باك اندك: مثال /api/admin/orders/{id}/confirm
      await axiosBrowser.post<ApiResponse<any>>(`/api/admin/orders/${order.id}/confirm`, {});
      setToast({ type: "success", message: "تم تأكيد الطلب بنجاح." });
      setIsConfirmOpen(false);
      router.refresh();
    } catch (err: any) {
      setToast({ type: "error", message: firstError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    setToast(null);

    try {
      // ✅ هذا يفترض وجود Laravel endpoint لإلغاء الطلب
      // غيّر المسار حسب باك اندك: مثال /api/admin/orders/{id}/cancel
      await axiosBrowser.post<ApiResponse<any>>(`/api/admin/orders/${order.id}/cancel`, {});
      setToast({ type: "success", message: "تم إلغاء الطلب." });
      setIsCancelOpen(false);
      router.refresh();
    } catch (err: any) {
      setToast({ type: "error", message: firstError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCreds = async () => {
    if (!order.card) return;
    const ok = await safeCopy(`Username: ${order.card.username}\nPassword: ${order.card.password}`);
    setToast(ok ? { type: "success", message: "تم نسخ بيانات البطاقة." } : { type: "error", message: "تعذر النسخ." });
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setIsViewOpen(true)} aria-label="عرض">
          <Eye className="h-4 w-4" />
        </Button>

        {isPending && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="text-green-700"
              onClick={() => setIsConfirmOpen(true)}
              aria-label="تأكيد"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setIsCancelOpen(true)}
              aria-label="إلغاء"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* View */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>

          {toast && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
            >
              {toast.message}
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">UUID</div>
                  <code className="rounded bg-muted px-2 py-1 text-xs">{order.uuid}</code>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                  <Badge variant="outline">{paymentLabel(order.payment_method)}</Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">العميل</div>
                  <div className="font-medium">{order.user?.full_name || "غير معروف"}</div>
                  <div className="text-xs text-muted-foreground">{order.user?.phone || "-"}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">الباقة</div>
                  <div className="font-medium">{order.package?.name_ar || "-"}</div>
                  {order.package?.price ? (
                    <div className="text-xs text-muted-foreground">₪ {order.package.price}</div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">الإجمالي</div>
                  <div className="text-xl font-bold text-primary">{money(order.total_price)}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">تاريخ الإنشاء</div>
                  <div className="text-sm">
                    {order.created_at ? new Date(order.created_at).toLocaleString("ar-SA") : "-"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">الملاحظات</div>
                  <div className="text-sm">{order.notes || "—"}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {order.payment_proof_url ? "يوجد إثبات دفع" : "لا يوجد إثبات دفع"}
                </div>

                {order.payment_proof_url ? (
                  <a
                    href={order.payment_proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4"
                  >
                    <ExternalLink className="h-4 w-4" />
                    عرض الإثبات
                  </a>
                ) : null}
              </div>
            </div>

            {/* Card credentials (only when confirmed) */}
            {order.card && order.status === "confirmed" && (
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="font-medium">بيانات البطاقة المخصصة</div>
                  <Button variant="outline" size="sm" onClick={copyCreds}>
                    <Copy className="ml-2 h-4 w-4" />
                    نسخ
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Username</div>
                    <code className="block rounded bg-muted px-2 py-2 text-xs">{order.card.username}</code>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Password</div>
                    <code className="block rounded bg-muted px-2 py-2 text-xs">{order.card.password}</code>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              إغلاق
            </Button>

            {order.status === "pending" && (
              <div className="flex items-center gap-2">
                <Button variant="destructive" onClick={() => { setIsViewOpen(false); setIsCancelOpen(true); }}>
                  إلغاء الطلب
                </Button>
                <Button onClick={() => { setIsViewOpen(false); setIsConfirmOpen(true); }}>
                  تأكيد الطلب
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الطلب</DialogTitle>
            <DialogDescription>
              سيتم تأكيد الطلب وتخصيص بطاقة من الباقات المتوفرة (حسب منطق السيرفر). هل تريد المتابعة؟
            </DialogDescription>
          </DialogHeader>

          {toast && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
            >
              {toast.message}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isLoading}>
              تراجع
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="ml-2 h-4 w-4" />}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إلغاء الطلب</DialogTitle>
            <DialogDescription>سيتم تغيير حالة الطلب إلى cancelled. هل أنت متأكد؟</DialogDescription>
          </DialogHeader>

          {toast && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
            >
              {toast.message}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)} disabled={isLoading}>
              تراجع
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
              {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <XCircle className="ml-2 h-4 w-4" />}
              إلغاء الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
