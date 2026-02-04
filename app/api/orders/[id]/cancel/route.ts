import { NextResponse } from "next/server";
import { laravelClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function POST(_: Request, context: { params: { id: string } }) {
    try {
        const { id } = context.params;

        const client = laravelClient({ withAuth: true });
        const res = await client.post(`/orders/${id}/cancel`);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
