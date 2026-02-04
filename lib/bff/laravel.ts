import axios, { AxiosInstance } from "axios";
import { cookies } from "next/headers";

const BASE = process.env.LARAVEL_API_BASE_URL;

function getBaseUrl() {
    if (!BASE) throw new Error("Missing env LARAVEL_API_BASE_URL");
    return BASE;
}

// ✅ بدون توكن
export function laravelClient(): AxiosInstance {
    return axios.create({
        baseURL: getBaseUrl(),
        headers: { Accept: "application/json" },
        timeout: 20000,
    });
}

// ✅ مع توكن (Async)
export async function laravelAuthClient(): Promise<AxiosInstance> {
    const client = laravelClient();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
        client.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    return client;
}

/**
 * Utility: convert Next request URL query params into plain object.
 */
export function queryToObject(url: URL): Record<string, string | string[]> {
    const out: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
        if (out[key] === undefined) out[key] = value;
        else if (Array.isArray(out[key])) (out[key] as string[]).push(value);
        else out[key] = [out[key] as string, value];
    });
    return out;
}


/**
 * Utility: normalize Axios error payload for NextResponse.
 */
export function normalizeAxiosError(err: any): { status: number; data: any } {
    const status = err?.response?.status || 500;
    const data =
        err?.response?.data ||
        ({
            success: false,
            message: "Server error",
            data: null,
        } as const);

    return { status, data };
}

