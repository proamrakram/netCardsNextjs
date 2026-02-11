"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Mail, Phone, Shield, Hash, ShoppingCart, CreditCard } from "lucide-react";

type UserRow = {
    id: string | number;
    uuid?: string | null;
    full_name: string;
    phone?: string | null;
    username: string;
    email: string;
    role: string;
    orders_count?: number;
    cards_count?: number;
    created_at?: string;
};

type ApiOneResponse = {
    success: boolean;
    message?: string;
    data?: { user?: UserRow };
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

function roleBadge(role: string) {
    if (role === "admin") return <Badge>Admin</Badge>;
    return <Badge variant="outline">User</Badge>;
}

export default function AdminUserDetailsPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState<UserRow | null>(null);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get<ApiOneResponse>(`/api/admin/users/${id}`, {
                withCredentials: true,
                headers: { Accept: "application/json" },
            });
            const u = res.data?.data?.user;
            if (!u) throw new Error("User not found.");
            setUser(u);
        } catch (err) {
            setError(extractAxiosError(err));
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">تفاصيل المستخدم</h1>
                    <p className="mt-1 text-sm text-muted-foreground">عرض معلومات المستخدم وإحصائياته.</p>
                </div>

                <Button asChild variant="outline">
                    <Link href="/admin/users">
                        <ArrowLeft className="ml-2 h-4 w-4" />
                        رجوع
                    </Link>
                </Button>
            </div>

            {loading ? (
                <Card>
                    <CardContent className="py-14 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        <div className="mt-2 text-sm text-muted-foreground">جاري التحميل...</div>
                    </CardContent>
                </Card>
            ) : error ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            ) : !user ? null : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card>
                            <CardContent className="flex items-center justify-between py-6">
                                <div>
                                    <div className="text-sm text-muted-foreground">عدد الطلبات</div>
                                    <div className="mt-2 text-3xl font-bold">{user.orders_count ?? 0}</div>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted/10">
                                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center justify-between py-6">
                                <div>
                                    <div className="text-sm text-muted-foreground">عدد البطاقات</div>
                                    <div className="mt-2 text-3xl font-bold">{user.cards_count ?? 0}</div>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted/10">
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Details */}
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-lg">بيانات المستخدم</CardTitle>
                        </CardHeader>
                        <CardContent className="py-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-xl border p-4">
                                    <div className="text-sm text-muted-foreground">الاسم</div>
                                    <div className="mt-1 text-base font-semibold">{user.full_name}</div>
                                </div>

                                <div className="rounded-xl border p-4">
                                    <div className="text-sm text-muted-foreground">الدور</div>
                                    <div className="mt-2">{roleBadge(user.role)}</div>
                                </div>

                                <div className="rounded-xl border p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" /> Email
                                    </div>
                                    <div className="mt-1 font-semibold">{user.email}</div>
                                </div>

                                <div className="rounded-xl border p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4" /> Phone
                                    </div>
                                    <div className="mt-1 font-semibold">{user.phone ?? "—"}</div>
                                </div>

                                <div className="rounded-xl border p-4 md:col-span-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Hash className="h-4 w-4" /> UUID
                                    </div>
                                    <div className="mt-1 break-all font-mono text-sm">{user.uuid ?? "—"}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
