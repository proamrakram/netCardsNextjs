// app/api/admin/cards/index/route.ts
import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const client = await laravelAuthClient();

        // Laravel: POST /api/admin/cards (index) أو عدّل حسب مسارك الحقيقي
        const res = await client.post("/backend/admin/cards/index", body);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
