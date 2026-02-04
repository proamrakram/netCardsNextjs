// components/admin/orders/orders-filters.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FilterX } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "cancelled";
type PaymentMethod = "BOP" | "cash" | "palpay";

type PackageDTO = { id: string | number; name_ar: string };

function getParam(sp: URLSearchParams, key: string) {
    return sp.get(key) ?? "";
}

export default function OrdersFilters({
    packages = [],
}: {
    packages?: PackageDTO[];
}) {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<OrderStatus | "">("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
    const [userId, setUserId] = useState("");
    const [packageId, setPackageId] = useState("");
    const [perPage, setPerPage] = useState("20");

    useEffect(() => {
        setSearch(getParam(sp, "search"));
        setStatus((getParam(sp, "status") as any) || "");
        setPaymentMethod((getParam(sp, "payment_method") as any) || "");
        setUserId(getParam(sp, "user_id"));
        setPackageId(getParam(sp, "package_id"));
        setPerPage(getParam(sp, "per_page") || "20");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sp]);

    const canSearch = useMemo(() => {
        return !!(search || status || paymentMethod || userId || packageId || perPage);
    }, [search, status, paymentMethod, userId, packageId, perPage]);

    function buildUrl() {
        const q = new URLSearchParams();

        if (search) q.set("search", search);
        if (status) q.set("status", status);
        if (paymentMethod) q.set("payment_method", paymentMethod);
        if (userId) q.set("user_id", userId);
        if (packageId) q.set("package_id", packageId);
        if (perPage) q.set("per_page", perPage);

        q.set("page", "1");
        const qs = q.toString();
        return qs ? `${pathname}?${qs}` : pathname;
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.push(buildUrl());
    }

    function onReset() {
        router.push(pathname);
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3 space-y-2">
                    <Label>بحث (UUID)</Label>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="مثال: 9b594bc9-..." />
                </div>

                <div className="lg:col-span-2 space-y-2">
                    <Label>الحالة</Label>
                    <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : (v as any))}>
                        <SelectTrigger>
                            <SelectValue placeholder="الكل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="pending">pending</SelectItem>
                            <SelectItem value="confirmed">confirmed</SelectItem>
                            <SelectItem value="cancelled">cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="lg:col-span-2 space-y-2">
                    <Label>طريقة الدفع</Label>
                    <Select
                        value={paymentMethod || "all"}
                        onValueChange={(v) => setPaymentMethod(v === "all" ? "" : (v as any))}
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

                <div className="lg:col-span-2 space-y-2">
                    <Label>user_id</Label>
                    <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="مثال: 12" />
                </div>

                <div className="lg:col-span-3 space-y-2">
                    <Label>الباقة</Label>
                    <Select value={packageId || "all"} onValueChange={(v) => setPackageId(v === "all" ? "" : v)}>
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
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="w-full sm:w-auto space-y-2">
                    <Label>per_page</Label>
                    <Input
                        type="number"
                        min={1}
                        max={200}
                        value={perPage}
                        onChange={(e) => setPerPage(e.target.value)}
                        className="w-40"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={onReset}>
                        <FilterX className="ml-2 h-4 w-4" />
                        مسح
                    </Button>
                    <Button type="submit" disabled={!canSearch}>
                        <Search className="ml-2 h-4 w-4" />
                        بحث
                    </Button>
                </div>
            </div>
        </form>
    );
}
