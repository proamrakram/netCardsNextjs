// app/api/packages/route.ts
import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

/**
 * BFF: User packages index
 *
 * Proxies to Laravel:
 *   POST {LARAVEL_API_BASE_URL}/user/packages/index
 *
 * Expected body:
 * {
 *   search: string,
 *   category_id: string|number|null,
 *   type: string[],
 *   per_page: number,
 *   page?: number
 * }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const client = await laravelAuthClient();
        const res = await client.post("/api/user/packages/index", body);

        const response = NextResponse.json(res.data, { status: 200 });
        response.headers.set("x-bff-route", "user-packages-index");
        return response;
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
