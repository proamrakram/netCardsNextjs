import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError, queryToObject } from "@/lib/bff/laravel";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const params = queryToObject(url);

        const client = await laravelAuthClient();
        const res = await client.post("/api/backend/admin/users/index", params);

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
        const res = await client.post("/api/backend/admin/users/index", body);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
