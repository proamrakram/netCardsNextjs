import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError, queryToObject } from "@/lib/bff/laravel";

/**
 * Proxy لعملية استعراض الفئات (index) في Laravel.
 * Laravel route: POST /api/admin/categories/index
 */

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const params = queryToObject(url);

        const client = await laravelAuthClient();
        // نحافظ على نفس الـ contract: GET هنا -> POST في Laravel
        const res = await client.post("/api/backend/admin/categories/index", params);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const client = await laravelAuthClient();
        const res = await client.post("/api/backend/admin/categories/index", body);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
