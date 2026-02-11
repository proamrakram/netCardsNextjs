import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function GET(
    _: Request,
    context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const client = await laravelAuthClient();
        const res = await client.get(`/api/backend/admin/orders/${id}/cancel`);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
