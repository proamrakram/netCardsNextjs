import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

type UpdatePackageBody = {
    category_id?: string | number;
    name?: string;
    name_ar?: string;
    description?: string | null;
    duration?: string;
    price?: string | number;
    status?: "active" | "inactive";
    type?: "hourly" | "monthly";
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, message: "Unauthenticated.", data: null }, { status: 401 });
        }

        const url = new URL(req.url);
        const with_category = url.searchParams.get("with_category") ?? "1";
        const with_counts = url.searchParams.get("with_counts") ?? "1";

        const client = await laravelAuthClient();

        // ✅ حسب شغلك الحالي: /api/admin/...
        const res = await client.get(`/api/admin/packages/${id}`, {
            params: { with_category, with_counts },
        });

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, message: "Unauthenticated.", data: null }, { status: 401 });
        }

        const body = (await req.json()) as UpdatePackageBody;

        // تنظيف بسيط (Laravel validation هو الأساس)
        const payload: UpdatePackageBody = {
            category_id: body.category_id,
            name: body.name?.toString(),
            name_ar: body.name_ar?.toString(),
            description: body.description === "" ? null : body.description ?? undefined,
            duration: body.duration?.toString(),
            price: body.price as any,
            status: body.status,
            type: body.type,
        };

        // إزالة undefined keys
        Object.keys(payload).forEach((k) => {
            if ((payload as any)[k] === undefined) delete (payload as any)[k];
        });

        const client = await laravelAuthClient();
        const res = await client.put(`/api/admin/packages/${id}`, payload);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
