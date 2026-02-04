import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

type LaravelCategory = {
    id: string | number;
    uuid?: string | null;
    name?: string;
    name_ar: string;
    type?: "hourly" | "monthly";
    description?: string | null;
    created_at?: string;
    updated_at?: string;
};

type LaravelCategoriesResponse = {
    success: boolean;
    message?: string;
    data?: {
        items?: LaravelCategory[];
    };
};

export async function GET() {
    try {
        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: [] },
                { status: 401 }
            );
        }

        const client = await laravelAuthClient();

        // عدّل المسار إذا كان عندك مختلف في Laravel
        const res = await client.get<LaravelCategoriesResponse>("/api/admin/categories");

        const items = res.data?.data?.items ?? [];

        // نطبّع الرد عشان الفرونت يتعامل بسهولة
        return NextResponse.json(
            { success: true, message: res.data?.message ?? "OK", data: items },
            { status: 200 }
        );
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
