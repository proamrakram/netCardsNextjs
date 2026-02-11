import { NextResponse } from "next/server";
import { laravelClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const client = laravelClient(); // ✅ بدون auth
        const res = await client.post("/api/auth/login", body);

        const token = res.data?.data?.token;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Login succeeded but token is missing from API response. Check Laravel /api/auth/login response.",
                    data: res.data,
                },
                { status: 500 }
            );
        }

        const response = NextResponse.json(res.data, { status: 200 });

        // ✅ في الديف خلّيه false لتجنب مشاكل secure على http
        response.cookies.set("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            path: "/",
        });

        response.headers.set("x-bff-route", "auth-login");
        response.headers.set("x-bff-cookie-set", "1");

        return response;
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
