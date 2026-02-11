// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

// GET /api/checkout?package_id=123
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const packageId = url.searchParams.get("package_id");

        if (!packageId) {
            return NextResponse.json(
                { success: false, message: "package_id is required", data: null },
                { status: 400 }
            );
        }

        const client = await laravelAuthClient();
        const res = await client.get(`/backend/user/packages/${packageId}`);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}

// POST /api/checkout
// body: { package_id, payment_method, notes }
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
        const res = await client.post("/backend/user/orders/store", {
            package_id: Number(body.package_id),
            payment_method: body.payment_method ?? "BOP",
            quantity: body.quantity,
            notes: body.notes ?? null,
        });

        return NextResponse.json(res.data, { status: res.status || 201 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
