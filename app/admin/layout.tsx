import type React from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { laravelServerFetch } from "@/lib/laravel/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[ADMIN LAYOUT] entered");

  // 1) تحقق من تسجيل الدخول عبر Laravel
  let me: any;
  try {
    me = await laravelServerFetch("/backend/auth/me");
  } catch {
    console.log("[ADMIN LAYOUT] redirect login");
    redirect("/auth/login");
  }

  // 2) تحقق من صلاحيات الأدمن
  const roles: string[] = me?.data?.user?.roles || [];
  if (!roles.includes("admin")) {
    console.log("[ADMIN LAYOUT] redirect dashboard");
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  );
}
