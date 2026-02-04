// app/api/admin/packages/[id]/cards/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, message: "Unauthenticated.", data: null }, { status: 401 });
        }

        const url = new URL(req.url);
        const username = url.searchParams.get("username") || "";
        const status = url.searchParams.get("status") || "";
        const page = url.searchParams.get("page") || "1";
        const per_page = url.searchParams.get("per_page") || "20";

        const client = await laravelAuthClient();
        const res = await client.get(`/api/admin/packages/${id}/cards`, {
            params: { username, status, page, per_page },
        });

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
