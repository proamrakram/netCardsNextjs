import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary/5 to-background p-6">
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <CheckCircle className="h-10 w-10 text-accent" />
              </div>
              <CardTitle className="text-2xl">تم إنشاء حسابك بنجاح!</CardTitle>
              <CardDescription>يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-3 rounded-lg bg-muted p-4">
                <Mail className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. اضغط على الرابط في الرسالة لتفعيل حسابك.
                </p>
              </div>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/auth/login">العودة لتسجيل الدخول</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
