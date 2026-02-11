import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const client = await laravelAuthClient();
        const res = await client.post("/api/admin/users", body);

        return NextResponse.json(res.data, { status: 201 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
