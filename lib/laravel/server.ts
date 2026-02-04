import axios, { AxiosRequestConfig } from "axios";
import { cookies } from "next/headers";
import { laravelClient } from "../bff/laravel";

/**
 * Utility: axios wrapper for server-side requests with Laravel auth cookie.
 */
export async function laravelServerFetch(
    path: string,
    config?: AxiosRequestConfig
) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await laravelClient().request({
            ...config,
            url: path,
            headers: {
                ...headers,
                ...config?.headers,
            },
        });

        return response.data;
    } catch (err: any) {
        const message =
            err?.response?.data?.message ||
            `Request failed (${err?.response?.status})`;

        const error = new Error(message);
        (error as any).status = err?.response?.status || 500;
        (error as any).payload = err?.response?.data;

        throw error;
    }
}