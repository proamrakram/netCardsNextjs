import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> } // ✅ params Promise
) {
    try {
        const { id } = await ctx.params;        // ✅ unwrap

        const client = await laravelAuthClient();
        const res = await client.get(`/backend/admin/orders/${id}/confirm`);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
