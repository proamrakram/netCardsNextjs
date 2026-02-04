import Link from "next/link"
import { Wifi } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Wifi className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">NetCards</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              متجرك الموثوق لبطاقات واشتراكات الإنترنت بأسعار منافسة وجودة عالية.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">روابط سريعة</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-primary">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/packages" className="transition-colors hover:text-primary">
                  الباقات
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-primary">
                  من نحن
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">الباقات</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/packages?type=hourly" className="transition-colors hover:text-primary">
                  باقات الساعات
                </Link>
              </li>
              <li>
                <Link href="/packages?type=monthly" className="transition-colors hover:text-primary">
                  الاشتراكات الشهرية
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">تواصل معنا</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>البريد: support@netcards.com</li>
              <li>الهاتف: +966 50 000 0000</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} NetCards. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  )
}
