"use client";

import { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Textarea } from "@/components/ui/textarea";

import {
    Plus,
    Search,
    FilterX,
    Loader2,
    Pencil,
    Trash2,
    RefreshCw,
    Tags,
    Hash,
    Text,
    AlignLeft,
} from "lucide-react";

type CategoryType = "hourly" | "monthly";

type CategoryRow = {
    id: string | number;
    uuid?: string | null;
    name?: string | null;
    name_ar: string;
    type: CategoryType;
    description?: string | null;
    created_at?: string;
};

type PaginationMeta = {
    current_page?: number;
    per_page?: number;
    total_items?: number;
    total_pages?: number;
};

type ApiIndexResponse = {
    success: boolean;
    message?: string;
    data?: {
        items?: CategoryRow[];
        meta?: PaginationMeta;
    };
};

type ApiOneResponse = {
    success: boolean;
    message?: string;
    data?: {
        category?: CategoryRow;
    };
};

type Filters = {
    search: string;
    type: "all" | CategoryType;
    per_page: number;
};

const DEFAULT_FILTERS: Filters = {
    search: "",
    type: "all",
    per_page: 20,
};

function extractAxiosError(err: unknown): string {
    const e = err as AxiosError<any>;
    const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Request failed.";
    return typeof msg === "string" ? msg : "Request failed.";
}

async function postCategoriesIndex(filters: Filters): Promise<ApiIndexResponse> {
    const res = await axios.post<ApiIndexResponse>(
        "/api/admin/categories/index",
        {
            type: filters.type === "all" ? undefined : filters.type,
            per_page: filters.per_page,
            with_packages: 0,
        },
        {
            withCredentials: true,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        }
    );

    return res.data;
}

type CategoryForm = {
    name: string;
    name_ar: string;
    type: CategoryType;
    description: string;
};

const EMPTY_FORM: CategoryForm = {
    name: "",
    name_ar: "",
    type: "monthly",
    description: "",
};

function typeBadge(type: CategoryType) {
    if (type === "hourly") {
        return <Badge variant="secondary">ساعات</Badge>;
    }
    return <Badge>شهري</Badge>;
}

export default function AdminCategoriesPage() {
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [payload, setPayload] = useState<ApiIndexResponse | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | number | null>(null);

    const items = payload?.data?.items ?? [];

    const rows = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        if (!q) return items;

        return items.filter((c) => {
            const hay = [c.uuid ?? "", c.name ?? "", c.name_ar ?? "", c.description ?? ""]
                .join(" ")
                .toLowerCase();
            return hay.includes(q);
        });
    }, [items, filters.search]);

    const hasFilters = useMemo(() => {
        return Boolean(
            filters.search.trim() || filters.type !== "all" || filters.per_page !== 20
        );
    }, [filters]);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await postCategoriesIndex(filters);
            setPayload(data);
        } catch (err) {
            setPayload(null);
            setError(extractAxiosError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reset = () => {
        setFilters(DEFAULT_FILTERS);
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = async (id: string | number) => {
        setEditingId(id);
        setSaving(true);
        setError("");
        try {
            const res = await axios.get<ApiOneResponse>(`/api/admin/categories/${id}`, {
                withCredentials: true,
                headers: { Accept: "application/json" },
            });
            const c = res.data?.data?.category;
            if (!c) throw new Error("Category not found.");

            setForm({
                name: c.name ?? "",
                name_ar: c.name_ar ?? "",
                type: (c.type as CategoryType) ?? "monthly",
                description: c.description ?? "",
            });

            setDialogOpen(true);
        } catch (err) {
            setError(extractAxiosError(err));
        } finally {
            setSaving(false);
        }
    };

    const submit = async () => {
        setSaving(true);
        setError("");
        try {
            const payload = {
                name: form.name,
                name_ar: form.name_ar,
                type: form.type,
                description: form.description,
            };

            if (editingId) {
                await axios.put(`/api/admin/categories/${editingId}`, payload, {
                    withCredentials: true,
                    headers: { Accept: "application/json" },
                });
            } else {
                await axios.post(`/api/admin/categories`, payload, {
                    withCredentials: true,
                    headers: { Accept: "application/json" },
                });
            }

            setDialogOpen(false);
            setEditingId(null);
            setForm(EMPTY_FORM);
            await load();
        } catch (err) {
            setError(extractAxiosError(err));
        } finally {
            setSaving(false);
        }
    };

    const doDelete = async (id: string | number) => {
        setDeletingId(id);
        setError("");
        try {
            await axios.delete(`/api/admin/categories/${id}`, {
                withCredentials: true,
                headers: { Accept: "application/json" },
            });
            await load();
        } catch (err) {
            setError(extractAxiosError(err));
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Top Bar */}
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-muted/30 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-background">
                            <Tags className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold leading-none">إدارة الفئات</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                إضافة / تعديل / حذف الفئات — تجربة منظمة وواضحة.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={load} disabled={loading}>
                            <RefreshCw className="ml-2 h-4 w-4" />
                            تحديث
                        </Button>

                        <Button onClick={openCreate}>
                            <Plus className="ml-2 h-4 w-4" />
                            إضافة فئة
                        </Button>
                    </div>
                </div>

                <CardContent className="py-5">
                    {/* Filters */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-full max-w-xl space-y-1">
                            <div className="text-sm text-muted-foreground">بحث</div>
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, search: e.target.value }))
                                    }
                                    placeholder="ابحث بالاسم أو UUID أو الوصف..."
                                    className="pr-9"
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">النوع</div>
                            <Select
                                value={filters.type}
                                onValueChange={(v) =>
                                    setFilters((f) => ({ ...f, type: v as any }))
                                }
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="اختر" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="hourly">ساعات</SelectItem>
                                    <SelectItem value="monthly">شهري</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Per Page</div>
                            <Select
                                value={String(filters.per_page)}
                                onValueChange={(v) =>
                                    setFilters((f) => ({ ...f, per_page: Number(v) }))
                                }
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue placeholder="20" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={load} disabled={loading}>
                                {loading ? (
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="ml-2 h-4 w-4" />
                                )}
                                تطبيق
                            </Button>

                            {hasFilters && (
                                <Button variant="outline" onClick={reset} disabled={loading}>
                                    <FilterX className="ml-2 h-4 w-4" />
                                    إعادة ضبط
                                </Button>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="mr-auto flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                            <span className="text-muted-foreground">الإجمالي:</span>
                            <span className="font-semibold">{rows.length}</span>
                            <span className="text-muted-foreground">فئة</span>
                        </div>
                    </div>

                    {!!error && (
                        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card className="overflow-hidden">

                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="text-lg">قائمة الفئات</CardTitle>
                </CardHeader>

                <CardContent className="p-4">
                    <div className="rounded-xl border bg-background">
                        <div className="overflow-x-auto">

                            <Table className="min-w-[1100px] border-collapse">
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="border text-center font-semibold">
                                            <div className="inline-flex items-center gap-2">
                                                <Text className="h-4 w-4 text-muted-foreground" />
                                                الاسم (AR)
                                            </div>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            <div className="inline-flex items-center gap-2">
                                                <Text className="h-4 w-4 text-muted-foreground" />
                                                الاسم (EN)
                                            </div>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            <div className="inline-flex items-center gap-2">
                                                <Tags className="h-4 w-4 text-muted-foreground" />
                                                النوع
                                            </div>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            <div className="inline-flex items-center gap-2">
                                                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                                الوصف
                                            </div>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            الإجراءات
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="border py-14 text-center">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    جاري تحميل الفئات...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="border py-14 text-center">
                                                <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted/20">
                                                        <Tags className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <div className="text-sm font-medium">لا توجد فئات</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        جرّب تغيير الفلاتر أو أضف فئة جديدة.
                                                    </div>
                                                    <Button className="mt-2" onClick={openCreate}>
                                                        <Plus className="ml-2 h-4 w-4" />
                                                        إضافة فئة
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((c) => (
                                            <TableRow
                                                key={String(c.id)}
                                                className="hover:bg-muted/20 transition-colors"
                                            >
                                                <TableCell className="border text-center align-middle font-medium">
                                                    {c.name_ar}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle">
                                                    {c.name ?? "—"}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle">
                                                    {typeBadge(c.type)}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle text-sm text-muted-foreground">
                                                    <div className="mx-auto max-w-[420px] truncate">
                                                        {c.description?.trim() ? c.description : "—"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border text-center align-middle">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEdit(c.id)}
                                                            disabled={saving}
                                                            className="h-9 w-9 p-0"
                                                            title="تعديل"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="h-9 w-9 p-0"
                                                                    disabled={deletingId === c.id}
                                                                    title="حذف"
                                                                >
                                                                    {deletingId === c.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>حذف الفئة؟</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        سيتم حذف الفئة نهائيًا. تأكد أنها غير مرتبطة بباقات/بيانات مهمة.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => doDelete(c.id)}>
                                                                        حذف
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Footer Hint */}
                    <div className="border-t bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                        تلميح: يمكنك الضغط Enter في البحث لتطبيق الفلاتر بسرعة.
                    </div>
                </CardContent>
            </Card>

            {/* Dialog: Create/Edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[640px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            {editingId ? "تعديل فئة" : "إضافة فئة"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">الاسم (AR)</div>
                                <Input
                                    value={form.name_ar}
                                    onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                                    placeholder="مثال: باقات شهري"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">الاسم (EN)</div>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="Monthly Packages"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">النوع</div>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as CategoryType }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hourly">ساعات</SelectItem>
                                        <SelectItem value="monthly">شهري</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">الحالة</div>
                                <Input
                                    value={editingId ? `تعديل — ID: ${editingId}` : "إضافة جديدة"}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">الوصف</div>
                            <Textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, description: e.target.value }))
                                }
                                placeholder="وصف اختياري..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            إلغاء
                        </Button>

                        <Button
                            onClick={submit}
                            disabled={saving || !form.name_ar.trim() || !form.type}
                        >
                            {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                            حفظ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
