import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, User } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary/5 to-background p-6">
        <Card className="mx-auto max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle className="h-12 w-12 text-accent" />
            </div>
            <CardTitle className="text-2xl">تم استلام طلبك بنجاح!</CardTitle>
            <CardDescription>تم إنشاء الطلب وحجز البطاقة. سيتم تأكيده حسب آلية المراجعة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p>يمكن متابعة حالة الطلب من صفحة "حسابي"</p>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <p>ستجد بيانات البطاقة ضمن الطلب (حسب حالته)</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" asChild>
                <Link href="/dashboard">الذهاب لحسابي</Link>
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" asChild>
                <Link href="/packages">تصفح المزيد</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
