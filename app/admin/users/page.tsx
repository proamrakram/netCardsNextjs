"use client";

import { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import Link from "next/link";

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

import {
    Plus,
    Search,
    FilterX,
    Loader2,
    Pencil,
    Trash2,
    RefreshCw,
    UserRoundCog,
    Mail,
    Phone,
    Shield,
    Hash,
    User,
    AtSign,
    Lock,
    ChevronLeft,
    ChevronRight,
    Eye,
} from "lucide-react";

type UserRole = "admin" | "user";

type UserRow = {
    id: string | number;
    uuid?: string | null;
    full_name: string;
    phone?: string | null;
    username: string;
    email: string;
    role: UserRole | string;
    orders_count?: number;
    cards_count?: number;
    created_at?: string;
};

type ApiIndexResponse = {
    success: boolean;
    message?: string;
    data?: {
        items?: UserRow[];
        meta?: {
            current_page?: number;
            per_page?: number;
            total_items?: number;
            total_pages?: number;
        };
    };
};

type ApiOneResponse = {
    success: boolean;
    message?: string;
    data?: { user?: UserRow };
};

type Filters = {
    q: string;
    role: "all" | UserRole;
    per_page: number;
    page: number;
};

const DEFAULT_FILTERS: Filters = {
    q: "",
    role: "all",
    per_page: 20,
    page: 1,
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

async function postUsersIndex(filters: Filters): Promise<ApiIndexResponse> {
    const res = await axios.post<ApiIndexResponse>(
        "/api/admin/users/index",
        {
            q: filters.q || undefined,
            role: filters.role === "all" ? undefined : filters.role,
            per_page: filters.per_page,
            page: filters.page,
            with_counts: 0,
        },
        {
            withCredentials: true,
            headers: { Accept: "application/json", "Content-Type": "application/json" },
        }
    );
    return res.data;
}

type UserForm = {
    full_name: string;
    phone: string;
    username: string;
    email: string;
    role: UserRole;
    password: string; // create required / update optional
};

const EMPTY_FORM: UserForm = {
    full_name: "",
    phone: "",
    username: "",
    email: "",
    role: "user",
    password: "",
};

function roleBadge(role: string) {
    if (role === "admin") return <Badge>Admin</Badge>;
    return <Badge variant="outline">User</Badge>;
}

export default function AdminUsersPage() {
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [payload, setPayload] = useState<ApiIndexResponse | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [form, setForm] = useState<UserForm>(EMPTY_FORM);

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | number | null>(null);

    const items = payload?.data?.items ?? [];
    const meta = payload?.data?.meta ?? {};
    const rows = useMemo(() => items, [items]);

    const currentPage = meta.current_page ?? filters.page;
    const totalPages = meta.total_pages ?? 1;

    const hasFilters = useMemo(() => {
        return Boolean(filters.q.trim() || filters.role !== "all" || filters.per_page !== 20);
    }, [filters]);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await postUsersIndex(filters);
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

    const apply = async () => {
        setFilters((f) => ({ ...f, page: 1 }));
        // نحمّل بعد setFilters عبر microtask
        setTimeout(load, 0);
    };

    const reset = () => {
        setFilters(DEFAULT_FILTERS);
        setTimeout(load, 0);
    };

    const goToPage = (page: number) => {
        const p = Math.max(1, Math.min(page, totalPages));
        setFilters((f) => ({ ...f, page: p }));
        setTimeout(load, 0);
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
            const res = await axios.get<ApiOneResponse>(`/api/admin/users/${id}`, {
                withCredentials: true,
                headers: { Accept: "application/json" },
            });
            const u = res.data?.data?.user;
            if (!u) throw new Error("User not found.");

            setForm({
                full_name: u.full_name ?? "",
                phone: u.phone ?? "",
                username: u.username ?? "",
                email: u.email ?? "",
                role: (u.role as UserRole) ?? "user",
                password: "",
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
            const body: any = {
                full_name: form.full_name,
                phone: form.phone || null,
                username: form.username,
                email: form.email,
                role: form.role,
            };

            if (editingId) {
                if (form.password.trim()) body.password = form.password.trim();
                await axios.put(`/api/admin/users/${editingId}`, body, {
                    withCredentials: true,
                    headers: { Accept: "application/json" },
                });
            } else {
                body.password = form.password.trim();
                await axios.post(`/api/admin/users`, body, {
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
            await axios.delete(`/api/admin/users/${id}`, {
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
            {/* Header + Filters */}
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-muted/30 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-background">
                            <UserRoundCog className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold leading-none">إدارة المستخدمين</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                إدارة الحسابات والأدوار وتحديث بيانات المستخدمين.
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
                            إضافة مستخدم
                        </Button>
                    </div>
                </div>

                <CardContent className="py-5">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-full max-w-xl space-y-1">
                            <div className="text-sm text-muted-foreground">بحث</div>
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={filters.q}
                                    onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                                    placeholder="ابحث بالاسم، اليوزرنيم، الإيميل، الهاتف، UUID..."
                                    className="pr-9"
                                    onKeyDown={(e) => e.key === "Enter" && apply()}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">الدور</div>
                            <Select
                                value={filters.role}
                                onValueChange={(v) => setFilters((f) => ({ ...f, role: v as any }))}
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="اختر" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="admin">admin</SelectItem>
                                    <SelectItem value="user">user</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Per Page</div>
                            <Select
                                value={String(filters.per_page)}
                                onValueChange={(v) => setFilters((f) => ({ ...f, per_page: Number(v) }))}
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
                            <Button onClick={apply} disabled={loading}>
                                {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Search className="ml-2 h-4 w-4" />}
                                تطبيق
                            </Button>

                            {hasFilters && (
                                <Button variant="outline" onClick={reset} disabled={loading}>
                                    <FilterX className="ml-2 h-4 w-4" />
                                    إعادة ضبط
                                </Button>
                            )}
                        </div>

                        <div className="mr-auto flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                            <span className="text-muted-foreground">الإجمالي:</span>
                            <span className="font-semibold">{meta.total_items ?? rows.length}</span>
                            <span className="text-muted-foreground">مستخدم</span>
                        </div>
                    </div>

                    {!!error && (
                        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="text-lg">قائمة المستخدمين</CardTitle>
                </CardHeader>

                <CardContent className="p-4">
                    <div className="rounded-xl border bg-background">
                        <div className="overflow-x-auto">

                            <Table className="min-w-[1100px] border-collapse">
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="border text-center font-semibold">
                                            <span className="inline-flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                ID
                                            </span>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            <span className="inline-flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                الاسم
                                            </span>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            <span className="inline-flex items-center gap-2">
                                                <AtSign className="h-4 w-4 text-muted-foreground" />
                                                Username
                                            </span>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            <span className="inline-flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                Email
                                            </span>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            <span className="inline-flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                Phone
                                            </span>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            <span className="inline-flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                Role
                                            </span>
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold">
                                            الإجراءات
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="border py-14 text-center">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    جاري تحميل المستخدمين...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="border py-14 text-center text-muted-foreground">
                                                لا يوجد مستخدمون.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((u) => (
                                            <TableRow key={String(u.id)} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="border text-center align-middle text-xs text-muted-foreground">
                                                    {u.id ?? "—"}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle font-medium">
                                                    {u.full_name}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle">
                                                    {u.username}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle">
                                                    {u.email}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle">
                                                    {u.phone ?? "—"}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle">
                                                    {roleBadge(u.role)}
                                                </TableCell>
                                                <TableCell className="border text-center align-middle">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 w-9 p-0"
                                                            title="عرض"
                                                        >
                                                            <Link href={`/admin/users/${u.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEdit(u.id)}
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
                                                                    disabled={deletingId === u.id}
                                                                    title="حذف"
                                                                >
                                                                    {deletingId === u.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>حذف المستخدم؟</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        سيتم حذف المستخدم نهائيًا. (لن تستطيع حذف نفسك أو الـ Super Admin أو آخر Admin).
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => doDelete(u.id)}>
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

                    {/* Pagination */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/10 px-4 py-3 text-sm">
                        <div className="text-muted-foreground">
                            صفحة <span className="font-semibold text-foreground">{currentPage}</span> من{" "}
                            <span className="font-semibold text-foreground">{totalPages}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={loading || currentPage <= 1}
                            >
                                <ChevronRight className="ml-1 h-4 w-4" />
                                السابق
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={loading || currentPage >= totalPages}
                            >
                                التالي
                                <ChevronLeft className="mr-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog Create/Edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[720px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            {editingId ? "تعديل مستخدم" : "إضافة مستخدم"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">الاسم الكامل</div>
                                <Input
                                    value={form.full_name}
                                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                                    placeholder="Amro Akram"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Role</div>
                                <Select
                                    value={form.role}
                                    onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">admin</SelectItem>
                                        <SelectItem value="user">user</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Username</div>
                                <div className="relative">
                                    <AtSign className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={form.username}
                                        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                                        placeholder="amro"
                                        className="pr-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="relative">
                                    <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={form.email}
                                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                        placeholder="amro@example.com"
                                        className="pr-9"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Phone</div>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={form.phone}
                                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                        placeholder="059..."
                                        className="pr-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">
                                    Password {editingId ? "(اختياري عند التعديل)" : "(مطلوب)"}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                        placeholder={editingId ? "اتركه فارغًا إن لم ترغب بالتغيير" : "••••••"}
                                        className="pr-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                            إلغاء
                        </Button>

                        <Button
                            onClick={submit}
                            disabled={
                                saving ||
                                !form.full_name.trim() ||
                                !form.username.trim() ||
                                !form.email.trim() ||
                                !form.role ||
                                (!editingId && !form.password.trim())
                            }
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
