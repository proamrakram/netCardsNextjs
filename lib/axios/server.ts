import axios, { AxiosInstance } from "axios";
import { cookies } from "next/headers";

const baseURL = process.env.LARAVEL_API_BASE_URL!;

export async function axiosServer(): Promise<AxiosInstance> {
    const client = axios.create({
        baseURL,
        headers: { Accept: "application/json" },
    });

    const cookieStore = await cookies(); // ✅ Next 16
    const token = cookieStore.get("token")?.value;

    if (token) {
        client.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    return client;
}
