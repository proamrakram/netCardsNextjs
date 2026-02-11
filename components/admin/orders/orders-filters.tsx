// components/admin/orders/orders-filters.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    FilterX,
    CalendarDays,
    CreditCard,
    Package as PackageIcon,
    User,
} from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "cancelled";
type PaymentMethod = "BOP" | "cash" | "palpay";

type PackageDTO = { id: string | number; name_ar: string };

export type OrdersFiltersValue = {
    search: string;
    status: "" | OrderStatus;
    payment_method: "" | PaymentMethod;
    user_id: string;
    package_id: string;
    from?: string;
    to?: string;
    page: number;
    per_page: number;
};

function isoDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function OrdersFilters({
    packages = [],
    value,
    onChange,
    loading,
}: {
    packages?: PackageDTO[];
    value: OrdersFiltersValue;
    onChange: (next: Partial<OrdersFiltersValue>) => void;
    loading?: boolean;
}) {
    const [local, setLocal] = useState<OrdersFiltersValue>(value);

    // keep local in sync when parent changes (important when reset/quick-filters)
    useMemo(() => {
        setLocal(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(value)]);

    const canSubmit = useMemo(() => {
        return (
            !!local.search ||
            !!local.status ||
            !!local.payment_method ||
            !!local.user_id ||
            !!local.package_id ||
            !!local.from ||
            !!local.to ||
            !!local.per_page
        );
    }, [local]);

    function apply(patch: Partial<OrdersFiltersValue>) {
        const next = { ...local, ...patch };
        setLocal(next);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        onChange({
            ...local,
            page: 1,
        });
    }

    function reset() {
        const cleared: OrdersFiltersValue = {
            search: "",
            status: "",
            payment_method: "",
            user_id: "",
            package_id: "",
            from: "",
            to: "",
            page: 1,
            per_page: value.per_page || 20,
        };
        setLocal(cleared);
        onChange(cleared);
    }

    function applyRangePreset(preset: "today" | "7d" | "30d") {
        const now = new Date();
        const to = isoDate(now);

        let fromDate = new Date(now);
        if (preset === "7d") fromDate.setDate(now.getDate() - 7);
        if (preset === "30d") fromDate.setDate(now.getDate() - 30);

        const from = preset === "today" ? to : isoDate(fromDate);

        const patch = { from, to, page: 1 } as Partial<OrdersFiltersValue>;
        setLocal((p) => ({ ...p, ...patch }));
        onChange(patch);
    }

    return (
        <form onSubmit={submit} className="space-y-4" dir="rtl">
            {/* Top row */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        بحث
                    </Label>
                    <Input
                        value={local.search}
                        onChange={(e) => apply({ search: e.target.value })}
                        placeholder="UUID أو ملاحظات..."
                    />
                </div>

                <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        من / إلى
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={local.from ?? ""}
                            onChange={(e) => apply({ from: e.target.value })}
                        />
                        <Input
                            type="date"
                            value={local.to ?? ""}
                            onChange={(e) => apply({ to: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-transparent h-8"
                            onClick={() => applyRangePreset("today")}
                            disabled={loading}
                        >
                            اليوم
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-transparent h-8"
                            onClick={() => applyRangePreset("7d")}
                            disabled={loading}
                        >
                            آخر 7 أيام
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-transparent h-8"
                            onClick={() => applyRangePreset("30d")}
                            disabled={loading}
                        >
                            آخر 30 يوم
                        </Button>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label>الحالة</Label>
                    <Select
                        value={local.status || "all"}
                        onValueChange={(v) => apply({ status: v === "all" ? "" : (v as any) })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="الكل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                            <SelectItem value="confirmed">مؤكد</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        طريقة الدفع
                    </Label>
                    <Select
                        value={local.payment_method || "all"}
                        onValueChange={(v) =>
                            apply({ payment_method: v === "all" ? "" : (v as any) })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="الكل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="BOP">BOP</SelectItem>
                            <SelectItem value="cash">cash</SelectItem>
                            <SelectItem value="palpay">palpay</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Second row */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        user_id
                    </Label>
                    <Input
                        value={local.user_id}
                        onChange={(e) => apply({ user_id: e.target.value })}
                        placeholder="مثال: 12"
                        inputMode="numeric"
                    />
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                        <PackageIcon className="h-4 w-4 text-muted-foreground" />
                        الباقة
                    </Label>
                    <Select
                        value={local.package_id || "all"}
                        onValueChange={(v) => apply({ package_id: v === "all" ? "" : v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="كل الباقات" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الباقات</SelectItem>
                            {packages.map((p) => (
                                <SelectItem key={String(p.id)} value={String(p.id)}>
                                    {p.name_ar}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>لكل صفحة</Label>
                    <Input
                        type="number"
                        min={1}
                        max={200}
                        value={String(local.per_page)}
                        onChange={(e) => apply({ per_page: Number(e.target.value || 20) })}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                    {canSubmit ? "جاهز للتطبيق" : "اختر فلتر واحد على الأقل"}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent"
                        onClick={reset}
                        disabled={loading}
                    >
                        <FilterX className="ml-2 h-4 w-4" />
                        مسح
                    </Button>

                    <Button type="submit" disabled={loading || !canSubmit}>
                        تطبيق
                    </Button>
                </div>
            </div>
        </form>
    );
}
