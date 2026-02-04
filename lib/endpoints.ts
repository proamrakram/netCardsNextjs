export const API = {
    auth: {
        login: "/auth/login",
        register: "/auth/register",
        me: "/auth/me",
        logout: "/auth/logout",
    },
    catalog: {
        categories: "/catalog/categories",
        packages: "/catalog/packages",
    },
    orders: {
        base: "/orders",
        confirm: (id: string) => `/orders/${id}/confirm`,
        cancel: (id: string) => `/orders/${id}/cancel`,
    },
    admin: {
        overview: "/admin/dashboard/overview",
        cardsStatus: "/admin/dashboard/cards-status",
        ordersTimeseries: "/admin/dashboard/orders-timeseries",
        latestOrders: "/admin/dashboard/latest-orders",
        packagesInventory: "/admin/dashboard/packages-inventory",
    },
} as const;
