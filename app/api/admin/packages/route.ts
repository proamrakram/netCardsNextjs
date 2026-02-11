import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

type CreatePackageBody = {
    category_id: string | number;
    name: string;
    name_ar: string;
    description?: string | null;
    duration: string;
    price: string | number;
    status: "active" | "inactive";
    type: "hourly" | "monthly";
};

export async function POST(req: Request) {
    try {
        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const body = (await req.json()) as Partial<CreatePackageBody>;

        if (!body.category_id || !body.name || !body.name_ar || !body.duration || body.price === undefined) {
            return NextResponse.json(
                { success: false, message: "Missing required fields.", data: null },
                { status: 422 }
            );
        }

        const payload: CreatePackageBody = {
            category_id: body.category_id,
            name: String(body.name),
            name_ar: String(body.name_ar),
            description: body.description ? String(body.description) : null,
            duration: String(body.duration),
            price: typeof body.price === "string" ? body.price : String(body.price),
            status: (body.status as any) ?? "active",
            type: (body.type as any) ?? "monthly",
        };

        const client = await laravelAuthClient();

        // ✅ مهم: هذا المسار يجب أن يطابق Laravel عندك
        // لو Laravel عندك POST /admin/packages (بدون /api) -> غيّر السطر التالي
        const res = await client.post("/backend/admin/packages", payload);

        return NextResponse.json(res.data, { status: 201 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
