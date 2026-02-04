import { NextResponse } from "next/server";
import { laravelAuthClient, laravelClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const client = await laravelAuthClient();
        const res = await client.post("/api/auth/register", body);

        const token = res.data?.data?.token;

        const response = NextResponse.json(res.data, { status: 201 });

        if (token) {
            response.cookies.set("token", token, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
            });
        }

        return response;
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
