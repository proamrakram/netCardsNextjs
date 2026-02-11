// app/api/user/packages/[packageId]/route.ts
import { NextResponse } from "next/server";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ packageId: string }> }
) {
    try {
        const { packageId } = await ctx.params;
        const client = await laravelAuthClient();
        const res = await client.get(`/api/user/packages/${packageId}`);
        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
