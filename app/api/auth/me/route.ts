import { NextResponse } from "next/server";
import { laravelAuthClient, laravelClient, normalizeAxiosError } from "@/lib/bff/laravel";
import { cookies } from "next/headers";

export async function GET() {
    // ✅ Next 16: cookies() returns Promise
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log(token);
    console.log(token);
    console.log(token);
    console.log(token);


    if (!token) {
        return NextResponse.json(
            { success: false, message: "Unauthenticated.", data: null },
            { status: 401 }
        );
    }

    try {
        const client = await laravelAuthClient();
        const res = await client.get("/api/auth/me");
        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
