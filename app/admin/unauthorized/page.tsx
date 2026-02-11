import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LayoutDashboard, Home } from "lucide-react";

export default function AdminUnauthorizedPage() {
    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">صلاحيات غير كافية</h1>
                <p className="mt-2 text-muted-foreground">
                    أنت Admin لكن لا تملك الإذن المطلوب لتنفيذ/عرض هذا القسم.
                </p>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        Access Denied
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        اطلب من مدير النظام منحك الصلاحية المطلوبة (Permission) مثل:
                        <span className="mx-1 font-medium text-foreground">view admin dashboard</span>
                        أو الصلاحية المناسبة لهذه الصفحة.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="default">
                            <Link href="/admin">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                العودة للداشبورد
                            </Link>
                        </Button>

                        <Button asChild variant="outline">
                            <Link href="/dashboard">
                                <Home className="h-4 w-4 mr-2" />
                                لوحة المستخدم
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
