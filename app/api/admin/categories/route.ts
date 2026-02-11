import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { laravelAuthClient, normalizeAxiosError, queryToObject } from "@/lib/bff/laravel";

/**
 * هذا المسار مخصّص لتغذية الفرونت بقائمة الفئات (لاستخدامها في Selects)
 * وكذلك إنشاء فئة جديدة.
 *
 * ✅ مهم: في Laravel عندك list عبارة عن POST /api/admin/categories/index
 * لذلك GET هنا سيقوم بالـ proxy إلى ذلك endpoint.
 */

type CategoryType = "hourly" | "monthly";

type CreateCategoryBody = {
    name: string;
    name_ar: string;
    type: CategoryType;
    description?: string | null;
};

export async function GET(req: Request) {
    try {
        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: [] },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const params = queryToObject(url);

        const client = await laravelAuthClient();

        // Laravel: POST /api/admin/categories/index
        const res = await client.post("/api/admin/categories/index", {
            ...params,
            // لاحقًا لو احتجت with_packages من هنا
            with_packages: params.with_packages ?? 0,
            per_page: params.per_page ?? 100,
        });

        // نتوقع: data.items = CategoryResource::collection(...)
        const items = res.data?.data?.items ?? [];

        // تبسيط الرد: {success, data: Category[]}
        return NextResponse.json(
            { success: true, message: res.data?.message ?? "OK", data: items },
            { status: 200 }
        );
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}

export async function POST(req: Request) {
    try {
        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const body = (await req.json()) as Partial<CreateCategoryBody>;

        if (!body.name || !body.name_ar || !body.type) {
            return NextResponse.json(
                { success: false, message: "Missing required fields.", data: null },
                { status: 422 }
            );
        }

        const payload: CreateCategoryBody = {
            name: String(body.name),
            name_ar: String(body.name_ar),
            type: body.type as CategoryType,
            description: body.description === "" ? null : body.description ?? null,
        };

        const client = await laravelAuthClient();
        const res = await client.post("/api/admin/categories", payload);

        return NextResponse.json(res.data, { status: 201 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
