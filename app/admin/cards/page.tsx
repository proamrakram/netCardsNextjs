"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { axiosBrowser } from "@/lib/axios/browser";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  CreditCard,
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  FilterX,
  Package as PackageIcon,
  BadgeCheck,
  BadgeX,
  Clock,
} from "lucide-react";

type CardStatus = "available" | "reserved" | "sold";

type AdminCardRow = {
  id: string | number;
  package_id: string | number;
  user_id?: string | number | null;

  username: string;
  password: string;
  status: CardStatus;

  reserved_at?: string | null;
  sold_at?: string | null;
  created_at?: string;

  package?: { name_ar?: string } | null;
};

type Paginated<T> = {
  items: T[];
  meta?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

type PackageDTO = {
  id: string | number;
  name_ar: string;
  status?: string;
};

type Filters = {
  search: string;
  package_id: string;
  status: "" | CardStatus;
  reserved_at: string; // YYYY-MM-DD
  sold_at: string; // YYYY-MM-DD
};

function statusLabel(status: CardStatus) {
  if (status === "available") return "متوفرة";
  if (status === "reserved") return "محجوزة";
  return "مباعة";
}

function statusVariant(status: CardStatus) {
  if (status === "available") return "default";
  if (status === "reserved") return "secondary";
  return "outline";
}

function statusIcon(status: CardStatus) {
  if (status === "available") return <BadgeCheck className="h-4 w-4" />;
  if (status === "reserved") return <Clock className="h-4 w-4" />;
  return <BadgeX className="h-4 w-4" />;
}

function fmtDate(d?: string | null) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("ar-SA");
}

function extractErrorMessage(err: any): string {
  const data = err?.response?.data;

  const fieldErrors = data?.errors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstKey = Object.keys(fieldErrors)[0];
    const firstMsg = Array.isArray(fieldErrors[firstKey]) ? fieldErrors[firstKey][0] : null;
    if (firstMsg) return firstMsg;
  }

  if (data?.message) return data.message;
  return err?.message || "حدث خطأ أثناء جلب البيانات";
}

function useDebouncedValue<T>(value: T, delayMs = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default function AdminCardsPage() {
  // server state
  const [cards, setCards] = useState<AdminCardRow[]>([]);
  const [meta, setMeta] = useState<Paginated<AdminCardRow>["meta"] | undefined>(undefined);

  // packages
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // applied filters (requests) + draft (form)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    package_id: "",
    status: "",
    reserved_at: "",
    sold_at: "",
  });
  const [draft, setDraft] = useState<Filters>(filters);

  // paging
  const [perPage, setPerPage] = useState<string>("20");
  const [page, setPage] = useState<number>(1);

  // ui
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced draft (optional UX)
  const debouncedDraft = useDebouncedValue(draft, 600);

  // Load packages (active only)
  useEffect(() => {
    let mounted = true;

    async function fetchPackages() {
      setLoadingPackages(true);
      try {
        const body = {
          search: "",
          category_id: null,
          status: ["active"],
          type: [],
          per_page: 200,
          with_category: 0,
        };

        const res = await axiosBrowser.post<ApiResponse<{ items: PackageDTO[] }>>(
          "/api/admin/packages/index",
          body
        );

        if (!mounted) return;
        const items = res.data?.data?.items ?? [];
        setPackages(Array.isArray(items) ? items : []);
      } catch {
        if (!mounted) return;
        setPackages([]);
      } finally {
        if (mounted) setLoadingPackages(false);
      }
    }

    fetchPackages();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch cards (POST) - supports explicit perPage to avoid stale state
  async function fetchCards(nextPage?: number, nextFilters?: Filters, nextPerPage?: string) {
    setError(null);
    setLoadingCards(true);

    const p = nextPage ?? page;
    const f = nextFilters ?? filters;
    const pp = nextPerPage ?? perPage;

    try {
      const body = {
        search: f.search?.trim() || "",
        package_id: f.package_id ? String(f.package_id) : null,
        user_id: null,
        status: f.status || "",
        reserved_at: f.reserved_at || "",
        sold_at: f.sold_at || "",
        page: p,
        per_page: pp === "all" ? 100 : Number(pp || 20),
        with_package: 1,
      };

      const res = await axiosBrowser.post<ApiResponse<Paginated<AdminCardRow>>>(
        "/api/admin/cards/index",
        body
      );

      const data = res.data?.data;
      const items = data?.items ?? [];
      const m = data?.meta;

      setCards(Array.isArray(items) ? items : []);
      setMeta(m);
    } catch (err: any) {
      setCards([]);
      setMeta(undefined);
      setError(extractErrorMessage(err));
    } finally {
      setLoadingCards(false);
    }
  }

  // initial load
  useEffect(() => {
    fetchCards(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional: auto-apply (debounced) when typing search only (does not auto trigger on dates/selects unless you want)
  useEffect(() => {
    // Only trigger when search changes (keep conservative)
    if (debouncedDraft.search !== filters.search) {
      const next = { ...filters, search: debouncedDraft.search };
      setFilters(next);
      setPage(1);
      fetchCards(1, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft.search]);

  const hasFilters = useMemo(() => {
    return Boolean(
      (filters.search && filters.search.trim() !== "") ||
      (filters.package_id && String(filters.package_id).trim() !== "") ||
      (filters.status && filters.status.trim() !== "") ||
      (filters.reserved_at && filters.reserved_at.trim() !== "") ||
      (filters.sold_at && filters.sold_at.trim() !== "")
    );
  }, [filters]);

  const hasDraftFilters = useMemo(() => {
    return Boolean(
      (draft.search && draft.search.trim() !== "") ||
      (draft.package_id && String(draft.package_id).trim() !== "") ||
      (draft.status && draft.status.trim() !== "") ||
      (draft.reserved_at && draft.reserved_at.trim() !== "") ||
      (draft.sold_at && draft.sold_at.trim() !== "")
    );
  }, [draft]);

  const availableCount = useMemo(() => cards.filter((c) => c.status === "available").length, [cards]);
  const reservedCount = useMemo(() => cards.filter((c) => c.status === "reserved").length, [cards]);
  const soldCount = useMemo(() => cards.filter((c) => c.status === "sold").length, [cards]);

  const applyFilters = () => {
    const next = {
      ...draft,
      search: draft.search?.trim() || "",
    };
    setFilters(next);
    setPage(1);
    fetchCards(1, next);
  };

  const resetFilters = () => {
    const clean: Filters = { search: "", package_id: "", status: "", reserved_at: "", sold_at: "" };
    setDraft(clean);
    setFilters(clean);
    setPage(1);
    fetchCards(1, clean);
  };

  const onChangePerPage = (v: string) => {
    setPerPage(v);
    setPage(1);
    fetchCards(1, undefined, v); // FIX: pass new perPage to avoid stale state
  };

  const goPrev = () => {
    const current = meta?.current_page ?? page;
    if (current <= 1) return;
    const next = current - 1;
    setPage(next);
    fetchCards(next);
  };

  const goNext = () => {
    const current = meta?.current_page ?? page;
    const total = meta?.total_pages ?? 1;
    if (current >= total) return;
    const next = current + 1;
    setPage(next);
    fetchCards(next);
  };

  const currentPage = meta?.current_page ?? page;
  const totalPages = meta?.total_pages ?? 1;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة البطاقات</h1>
          <p className="mt-2 text-muted-foreground">عرض جميع البطاقات وبيانات الدخول مع فلاتر وباجينيشن.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchCards(currentPage)}
            disabled={loadingCards}
            className="gap-2"
          >
            {loadingCards ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            تحديث
          </Button>

          <Button asChild className="gap-2">
            <Link href="/admin/cards/import">
              <Upload className="h-4 w-4" />
              رفع من Excel
            </Link>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center flex items-center justify-center gap-2">
              <BadgeCheck className="h-4 w-4 text-green-600" />
              متوفرة
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-green-600">{availableCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">ضمن الصفحة الحالية</div>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              محجوزة
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{reservedCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">ضمن الصفحة الحالية</div>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center flex items-center justify-center gap-2">
              <BadgeX className="h-4 w-4 text-primary" />
              مباعة
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-primary">{soldCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">ضمن الصفحة الحالية</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-muted/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            الفلاتر
            {hasFilters && (
              <Badge variant="secondary" className="mr-2">
                مفعلة
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            {/* Search */}
            <div className="w-full md:flex-1 md:min-w-[280px] space-y-2">
              <Label>بحث (Username / UUID)</Label>
              <Input
                className="h-10"
                value={draft.search}
                onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
                placeholder="101790... أو db80cda0..."
                disabled={loadingCards}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>

            {/* Package */}
            <div className="w-full md:w-[220px] space-y-2">
              <Label className="flex items-center gap-2">
                <PackageIcon className="h-4 w-4" />
                الباقة
              </Label>

              <Select
                value={draft.package_id || "all"}
                onValueChange={(v) => setDraft((p) => ({ ...p, package_id: v === "all" ? "" : v }))}
                disabled={loadingCards}
              >
                <SelectTrigger className="h-10 cursor-pointer">
                  <SelectValue placeholder="كل الباقات" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">كل الباقات</SelectItem>
                  {packages.map((p) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>
                      {p.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {loadingPackages && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري تحميل الباقات...
                </div>
              )}
            </div>

            {/* Status */}
            <div className="w-full md:w-[160px] space-y-2">
              <Label>الحالة</Label>
              <Select
                value={draft.status || "all"}
                onValueChange={(v) =>
                  setDraft((p) => ({ ...p, status: (v === "all" ? "" : (v as CardStatus)) as any }))
                }
                disabled={loadingCards}
              >
                <SelectTrigger className="h-10 cursor-pointer">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="available">متوفرة</SelectItem>
                  <SelectItem value="reserved">محجوزة</SelectItem>
                  <SelectItem value="sold">مباعة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reserved date */}
            <div className="w-full md:w-[170px] space-y-2">
              <Label>تاريخ الحجز</Label>
              <Input
                className="h-10"
                type="date"
                value={draft.reserved_at}
                onChange={(e) => setDraft((p) => ({ ...p, reserved_at: e.target.value }))}
                disabled={loadingCards}
              />
            </div>

            {/* Sold date */}
            <div className="w-full md:w-[170px] space-y-2">
              <Label>تاريخ البيع</Label>
              <Input
                className="h-10"
                type="date"
                value={draft.sold_at}
                onChange={(e) => setDraft((p) => ({ ...p, sold_at: e.target.value }))}
                disabled={loadingCards}
              />
            </div>

            {/* Actions (icons only) */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Button
                type="button"
                size="icon"
                onClick={applyFilters}
                disabled={loadingCards}
                aria-label="بحث"
                title="بحث"
              >
                {loadingCards ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={resetFilters}
                disabled={loadingCards || !hasDraftFilters}
                aria-label="مسح الفلاتر"
                title="مسح الفلاتر"
              >
                <FilterX className="h-4 w-4" />
              </Button>

              {hasFilters && <Badge variant="secondary">مفعلة</Badge>}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {meta ? (
                <>
                  صفحة {meta.current_page} / {meta.total_pages} — الإجمالي {meta.total_items}
                </>
              ) : (
                <>—</>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">عرض</span>
              <select
                value={perPage}
                disabled={loadingCards}
                onChange={(e) => onChangePerPage(e.target.value)}
                className="h-9 cursor-pointer rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="all">all</option>
              </select>
              <span className="text-sm text-muted-foreground">صف/صفحة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-muted/60">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            قائمة البطاقات
          </CardTitle>

          {meta && meta.total_pages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={loadingCards || currentPage <= 1} onClick={goPrev}>
                السابق
              </Button>
              <Button variant="outline" disabled={loadingCards || currentPage >= totalPages} onClick={goNext}>
                التالي
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loadingCards ? (
            <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري تحميل البطاقات...
            </div>
          ) : cards.length > 0 ? (
            <div className="w-full overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-[90px]">#</TableHead>
                    <TableHead className="text-center">الباقة</TableHead>
                    <TableHead className="text-center">اسم المستخدم</TableHead>
                    <TableHead className="text-center">كلمة المرور</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">الحجز</TableHead>
                    <TableHead className="text-center">البيع</TableHead>
                    <TableHead className="text-center">الإضافة</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {cards.map((card, idx) => (
                    <TableRow key={String(card.id)} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">
                        {meta?.per_page
                          ? (currentPage - 1) * Number(meta.per_page) + (idx + 1)
                          : idx + 1}
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="truncate inline-block max-w-[240px]">{card.package?.name_ar || "-"}</span>
                      </TableCell>

                      <TableCell className="text-center">
                        <code className="rounded bg-muted px-2 py-1 text-xs">{card.username}</code>
                      </TableCell>

                      <TableCell className="text-center">
                        <code className="inline-flex justify-center rounded bg-muted px-2 py-1 text-xs">
                          {card.password}
                        </code>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={statusVariant(card.status)}
                          className="px-3 inline-flex items-center gap-2"
                        >
                          {statusIcon(card.status)}
                          {statusLabel(card.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center text-muted-foreground">{fmtDate(card.reserved_at)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{fmtDate(card.sold_at)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{fmtDate(card.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                {hasFilters ? "لا توجد نتائج مطابقة للفلاتر" : "لا توجد بطاقات"}
              </p>
              <Button asChild className="gap-2">
                <Link href="/admin/cards/import">
                  <Upload className="h-4 w-4" />
                  رفع من Excel
                </Link>
              </Button>
            </div>
          )}

          {meta && meta.total_pages > 1 && (
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" disabled={loadingCards || currentPage <= 1} onClick={goPrev}>
                  السابق
                </Button>
                <Button variant="outline" disabled={loadingCards || currentPage >= totalPages} onClick={goNext}>
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
