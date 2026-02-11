import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-[70vh] p-6 flex items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        ليس لديك صلاحية للوصول
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        لا تملك الأذونات المطلوبة لعرض هذه الصفحة. إذا تعتقد أن هذا خطأ، تواصل مع الإدارة.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="default">
                            <Link href="/">
                                <Home className="h-4 w-4 mr-2" />
                                الصفحة الرئيسية
                            </Link>
                        </Button>

                        <Button asChild variant="outline">
                            <Link href="/dashboard">
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                الذهاب للوحة المستخدم
                            </Link>
                        </Button>

                        <Button asChild variant="secondary">
                            <Link href="/auth/login">
                                <LogIn className="h-4 w-4 mr-2" />
                                تسجيل الدخول
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
