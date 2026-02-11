"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wifi, LayoutDashboard, Package, CreditCard, Upload, Users, LogOut, Home, Tags, UserRoundCog } from "lucide-react";
import { axiosBrowser } from "@/lib/axios/browser";

const navItems = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/categories", label: "الفئات", icon: Tags },
  { href: "/admin/packages", label: "الباقات", icon: Package },
  { href: "/admin/cards", label: "البطاقات", icon: CreditCard },
  { href: "/admin/upload", label: "رفع Excel", icon: Upload },
  { href: "/admin/orders", label: "الطلبات", icon: Users },
  { href: "/admin/users", label: "المستخدمين", icon: UserRoundCog },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axiosBrowser.post("/api/auth/logout");
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-l bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Wifi className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <span className="font-bold">NetCards</span>
          <p className="text-xs text-muted-foreground">لوحة التحكم</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 border-t p-4">
        <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
          <Link href="/">
            <Home className="ml-2 h-4 w-4" />
            العودة للموقع
          </Link>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="ml-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}
