import { Button } from "@/components/ui/button"
import { Wifi, Shield, Clock, CreditCard } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Wifi className="h-4 w-4" />
            <span>متجر بطاقات الإنترنت الموثوق</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-balance md:text-5xl lg:text-6xl">
            اتصل بالعالم
            <span className="text-primary"> بسهولة وأمان</span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground text-pretty">
            احصل على بطاقات الإنترنت واشتراكاتك الشهرية بأفضل الأسعار. تسليم فوري لبيانات الدخول بعد تأكيد الدفع.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/packages">تصفح الباقات</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/sign-up">إنشاء حساب</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-4">
          {[
            { icon: Shield, title: "آمن وموثوق", desc: "بيانات مشفرة ومحمية" },
            { icon: Clock, title: "تسليم فوري", desc: "بعد تأكيد الدفع مباشرة" },
            { icon: CreditCard, title: "دفع سهل", desc: "تحويل بنكي مباشر" },
            { icon: Wifi, title: "تغطية شاملة", desc: "باقات متنوعة تناسب الجميع" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-3 rounded-xl bg-card p-6 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
