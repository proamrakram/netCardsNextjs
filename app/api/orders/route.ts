import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body?.package_id) {
            return NextResponse.json(
                { success: false, message: "package_id is required", data: null },
                { status: 400 }
            );
        }

        const client = await laravelAuthClient();
        const res = await client.post("/api/user/orders/store", {
            package_id: Number(body.package_id),
            payment_method: body.payment_method ?? "BOP",
            notes: body.notes ?? null,
        });

        return NextResponse.json(res.data, { status: res.status || 201 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
