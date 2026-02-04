"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterX, Search } from "lucide-react";

type CardStatus = "available" | "reserved" | "sold";

export type PackageCardRow = {
    id: string | number;
    username: string;
    password?: string; // ممكن تلغيه نهائيا من الـ Resource
    status: CardStatus;
    created_at?: string | null;
};

type Meta = {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
};

function statusLabel(s: CardStatus) {
    if (s === "available") return "متوفرة";
    if (s === "reserved") return "محجوزة";
    return "مباعة";
}

function statusVariant(s: CardStatus) {
    if (s === "available") return "default";
    if (s === "reserved") return "secondary";
    return "outline";
}

function qs(obj: Record<string, any>) {
    const sp = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined || v === null || String(v).trim() === "") return;
        sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : "";
}

export default function PackageDetailsCards({
    cards,
    meta,
}: {
    cards: PackageCardRow[];
    meta?: Meta;
}) {
    const pathname = usePathname();
    const sp = useSearchParams();

    const [username, setUsername] = useState(sp.get("username") ?? "");
    const [status, setStatus] = useState(sp.get("status") ?? "");
    const [perPage, setPerPage] = useState(sp.get("per_page") ?? "20");
    const [showPass, setShowPass] = useState(false);

    const hasFilters = useMemo(() => {
        return Boolean((sp.get("username") ?? "") || (sp.get("status") ?? "") || (sp.get("per_page") ?? ""));
    }, [sp]);

    const applyUrl = useMemo(() => {
        return `${pathname}${qs({ username, status, per_page: perPage, page: 1 })}`;
    }, [pathname, username, status, perPage]);

    const resetUrl = useMemo(() => pathname, [pathname]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="rounded-lg border p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Username</div>
                        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="بحث باليوزر..." className="w-60" />
                    </div>

                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="available / reserved / sold" className="w-56" />
                    </div>

                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Per Page</div>
                        <Input type="number" min={1} max={200} value={perPage} onChange={(e) => setPerPage(e.target.value)} className="w-28" />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild>
                            <Link href={applyUrl}>
                                <Search className="ml-2 h-4 w-4" />
                                بحث
                            </Link>
                        </Button>

                        <Button variant="outline" asChild disabled={!hasFilters}>
                            <Link href={resetUrl}>
                                <FilterX className="ml-2 h-4 w-4" />
                                مسح
                            </Link>
                        </Button>

                        <Button variant="outline" onClick={() => setShowPass((v) => !v)}>
                            {showPass ? "إخفاء كلمات المرور" : "إظهار كلمات المرور"}
                        </Button>
                    </div>

                    {hasFilters && <Badge variant="secondary">فلاتر مفعلة</Badge>}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center whitespace-nowrap">#</TableHead>
                            <TableHead className="text-center whitespace-nowrap">Username</TableHead>
                            <TableHead className="text-center whitespace-nowrap">Password</TableHead>
                            <TableHead className="text-center whitespace-nowrap">الحالة</TableHead>
                            <TableHead className="text-center whitespace-nowrap">تاريخ الإضافة</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {cards.map((c, idx) => (
                            <TableRow key={String(c.id)} className="text-center">
                                <TableCell className="font-medium">{idx + 1}</TableCell>

                                <TableCell>
                                    <code className="rounded bg-muted px-2 py-1 text-sm">{c.username}</code>
                                </TableCell>

                                <TableCell>
                                    {showPass ? (
                                        <code className="rounded bg-muted px-2 py-1 text-sm">{c.password ?? "-"}</code>
                                    ) : (
                                        <span className="text-muted-foreground">••••••</span>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                                </TableCell>

                                <TableCell className="text-muted-foreground">
                                    {c.created_at ? new Date(c.created_at).toLocaleDateString("ar-SA") : "-"}
                                </TableCell>
                            </TableRow>
                        ))}

                        {cards.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    لا توجد بطاقات مطابقة.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <Button variant="outline" disabled={meta.current_page <= 1} asChild={meta.current_page > 1}>
                        {meta.current_page > 1 ? (
                            <Link href={`${pathname}${qs({ ...Object.fromEntries(sp.entries()), page: meta.current_page - 1 })}`}>
                                السابق
                            </Link>
                        ) : (
                            <span>السابق</span>
                        )}
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        صفحة {meta.current_page} / {meta.total_pages} — الإجمالي {meta.total_items}
                    </div>

                    <Button variant="outline" disabled={meta.current_page >= meta.total_pages} asChild={meta.current_page < meta.total_pages}>
                        {meta.current_page < meta.total_pages ? (
                            <Link href={`${pathname}${qs({ ...Object.fromEntries(sp.entries()), page: meta.current_page + 1 })}`}>
                                التالي
                            </Link>
                        ) : (
                            <span>التالي</span>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
