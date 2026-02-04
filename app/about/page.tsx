import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, Users, Award, Clock } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold">من نحن</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                NetCards هو متجرك الموثوق لشراء بطاقات واشتراكات الإنترنت بكل سهولة وأمان
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="prose prose-lg mx-auto text-center">
                <p className="text-muted-foreground">
                  نقدم لكم خدمة بيع بطاقات الإنترنت والاشتراكات الشهرية بأفضل الأسعار وأعلى جودة. نحرص على توفير تجربة
                  شراء سلسة وآمنة مع تسليم فوري لبيانات الدخول بعد تأكيد الدفع.
                </p>
              </div>

              <div className="mt-16 grid gap-8 md:grid-cols-2">
                {[
                  {
                    icon: Shield,
                    title: "الأمان والموثوقية",
                    desc: "نضمن لك حماية بياناتك وخصوصيتك مع نظام دفع آمن وموثوق",
                  },
                  {
                    icon: Clock,
                    title: "تسليم فوري",
                    desc: "احصل على بيانات الدخول فور تأكيد عملية الدفع دون أي تأخير",
                  },
                  {
                    icon: Users,
                    title: "دعم العملاء",
                    desc: "فريق دعم متخصص جاهز لمساعدتك على مدار الساعة",
                  },
                  {
                    icon: Award,
                    title: "جودة عالية",
                    desc: "نقدم باقات متنوعة بجودة عالية تناسب جميع الاحتياجات",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 rounded-xl bg-card p-6 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
