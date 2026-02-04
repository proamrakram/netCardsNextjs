import { NextResponse } from "next/server";
import { laravelAuthClient, laravelClient } from "@/lib/bff/laravel";

export async function POST() {
    try {
        const client = await laravelAuthClient();
        await client.post("/api/auth/logout");
    } catch {
        // best effort
    }

    const res = NextResponse.json({
        success: true,
        message: "Logged out.",
        data: null,
    });

    res.cookies.set("token", "", { path: "/", maxAge: 0 });
    return res;
}
