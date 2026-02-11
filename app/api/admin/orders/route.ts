import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

function pickFirst(v: string | string[] | null) {
    if (!v) return "";
    return Array.isArray(v) ? v[0] : v;
}

function cleanPayload(obj: Record<string, any>) {
    Object.keys(obj).forEach((k) => {
        const v = obj[k];
        if (
            v === "" ||
            v === null ||
            v === undefined ||
            (Array.isArray(v) && v.length === 0)
        ) {
            delete obj[k];
        }
    });
    return obj;
}

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const url = new URL(req.url);

        const payload = cleanPayload({
            search: pickFirst(url.searchParams.get("search")),
            status: pickFirst(url.searchParams.get("status")),
            payment_method: pickFirst(url.searchParams.get("payment_method")),
            user_id: pickFirst(url.searchParams.get("user_id")),
            package_id: pickFirst(url.searchParams.get("package_id")),
            from: pickFirst(url.searchParams.get("from")),
            to: pickFirst(url.searchParams.get("to")),
            page: pickFirst(url.searchParams.get("page")) || "1",
            per_page: pickFirst(url.searchParams.get("per_page")) || "20",
        });

        const client = await laravelAuthClient();
        const res = await client.post("/backend/admin/orders/index", payload);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const body = await req.json();
        const payload = cleanPayload({ ...(body ?? {}) });

        const client = await laravelAuthClient();
        const res = await client.post("/backend/admin/orders/index", payload);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
