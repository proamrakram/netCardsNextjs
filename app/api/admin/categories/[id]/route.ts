import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { laravelAuthClient, normalizeAxiosError } from "@/lib/bff/laravel";

type CategoryType = "hourly" | "monthly";

type UpdateCategoryBody = {
    name?: string;
    name_ar?: string;
    type?: CategoryType;
    description?: string | null;
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const with_packages = url.searchParams.get("with_packages") ?? "0";

        const client = await laravelAuthClient();
        const res = await client.get(`/backend/admin/categories/${id}`, {
            params: { with_packages },
        });

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const body = (await req.json()) as UpdateCategoryBody;

        const payload: UpdateCategoryBody = {
            name: body.name?.toString(),
            name_ar: body.name_ar?.toString(),
            type: body.type,
            description: body.description === "" ? null : body.description ?? undefined,
        };

        Object.keys(payload).forEach((k) => {
            if ((payload as any)[k] === undefined) delete (payload as any)[k];
        });

        const client = await laravelAuthClient();
        const res = await client.put(`/backend/admin/categories/${id}`, payload);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthenticated.", data: null },
                { status: 401 }
            );
        }

        const client = await laravelAuthClient();
        const res = await client.delete(`/backend/admin/categories/${id}`);

        return NextResponse.json(res.data, { status: 200 });
    } catch (err: any) {
        const { status, data } = normalizeAxiosError(err);
        return NextResponse.json(data, { status });
    }
}
