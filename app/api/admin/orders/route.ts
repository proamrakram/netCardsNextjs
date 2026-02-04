// app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

// ✅ هذا الراوت داخل Next يعمل كـ BFF:
// - الواجهة (page.tsx) تعمل GET: /api/admin/orders?...params
// - هذا الراوت يحولها إلى POST على Laravel: /admin/orders/index (أو المسار الفعلي عندك)

function pickFirst(v: string | string[] | null) {
    if (!v) return "";
    return Array.isArray(v) ? v[0] : v;
}

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const url = new URL(req.url);

        const payload = {
            search: pickFirst(url.searchParams.get("search")),
            status: pickFirst(url.searchParams.get("status")),
            payment_method: pickFirst(url.searchParams.get("payment_method")),
            user_id: pickFirst(url.searchParams.get("user_id")),
            package_id: pickFirst(url.searchParams.get("package_id")),
            page: pickFirst(url.searchParams.get("page")) || "1",
            per_page: pickFirst(url.searchParams.get("per_page")) || "20",
        };

        // نظّف الحقول الفارغة
        Object.keys(payload).forEach((k) => {
            // @ts-ignore
            if (payload[k] === "") delete payload[k];
        });

        const client = await laravelAuthClient();

        // ✅ غيّر هذا المسار إذا كان مختلف عندك في Laravel
        // مثال: "/api/admin/orders" أو "/admin/orders/index"
        const res = await client.post("/api/admin/orders/index", payload);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const body = await req.json();
        const client = await laravelAuthClient();

        // ✅ نفس ملاحظة المسار
        const res = await client.post("/api/admin/orders/index", body);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
