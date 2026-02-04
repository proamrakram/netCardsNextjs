import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary/5 to-background p-6">
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl">حدث خطأ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{params.error || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}</p>
              <div className="flex gap-3">
                <Button className="flex-1" asChild>
                  <Link href="/auth/login">تسجيل الدخول</Link>
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" asChild>
                  <Link href="/">الرئيسية</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
