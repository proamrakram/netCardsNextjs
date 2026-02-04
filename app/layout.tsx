import type React from "react"
import type { Metadata } from "next"
import { Tajawal } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
})

export const metadata: Metadata = {
  title: "NetCards - بطاقات الإنترنت",
  description: "متجر بطاقات واشتراكات الإنترنت - باقات ساعات واشتراكات شهرية",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
