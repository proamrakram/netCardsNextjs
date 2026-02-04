"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosBrowser } from "@/lib/axios/browser";

type PackageDTO = {
  id: number | string;
  name_ar: string;
  price: string | number;
  status?: "active" | "inactive" | string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

type PackagesIndexData = {
  items: PackageDTO[];
  meta?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
};

type ImportResult = {
  created: number;
  skipped: number;
  duplicates: {
    in_file: { username: string; rows: number[]; reason: string }[];
    in_db: { username: string; rows: number[]; reason: string }[];
  };
};

type ParsedRow = {
  username: string;
  password: string;
  rowNumber: number;

  // UI flags
  dupInFile?: boolean;
  dupInDb?: boolean;
};

function pickCell(row: Record<string, any>, keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
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
  return err?.message || "حدث خطأ أثناء الطلب";
}

export default function UploadPage() {
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [importSummary, setImportSummary] = useState<ImportResult | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchPackages() {
      setLoadError(null);
      setPackagesLoading(true);

      try {
        // ✅ استخدام Route Handler الجديد عبر POST
        // ✅ فلترة status=[active]
        const body = {
          search: "",
          category_id: null,
          status: ["active"],
          type: [],
          per_page: 100, // حد مناسب لقائمة اختيار
          with_category: 0,
        };

        const res = await axiosBrowser.post<ApiResponse<PackagesIndexData>>(
          "/api/admin/packages/index",
          body
        );

        if (!mounted) return;

        const items = res.data?.data?.items ?? [];

        // (اختياري) حماية إضافية لو الباك رجع غير نشط بالخطأ
        const onlyActive = items.filter((p) => (p.status ?? "active") === "active");

        setPackages(onlyActive);
      } catch (err: any) {
        if (!mounted) return;
        setLoadError(extractErrorMessage(err));
      } finally {
        if (mounted) setPackagesLoading(false);
      }
    }

    fetchPackages();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper: mark duplicates within the file
  function markDuplicatesInFile(rows: ParsedRow[]): ParsedRow[] {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      const u = r.username.trim();
      counts.set(u, (counts.get(u) || 0) + 1);
    });

    return rows.map((r) => {
      const u = r.username.trim();
      const dup = (counts.get(u) || 0) > 1;
      return { ...r, dupInFile: dup, dupInDb: false };
    });
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      const rowsRaw: ParsedRow[] = jsonData
        .map((row, idx) => {
          const username = pickCell(row, ["username", "Username", "USER", "اسم المستخدم", "اسم_المستخدم"]);
          const password = pickCell(row, ["password", "Password", "PASS", "كلمة المرور", "كلمة_المرور"]);

          return {
            username,
            password,
            rowNumber: idx + 2, // header row is 1
          };
        })
        .filter((r) => r.username && r.password);

      const rows = markDuplicatesInFile(rowsRaw);
      setParsedData(rows);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      setResult({ success: false, message: "يرجى اختيار ملف Excel صالح" });
      return;
    }

    if (!selectedPackage) {
      setResult({ success: false, message: "يرجى اختيار الباقة قبل الرفع." });
      return;
    }

    setIsUploading(true);
    setResult(null);
    setImportSummary(null);

    try {
      const payload = {
        package_id: selectedPackage,
        items: parsedData.map((r) => ({
          username: r.username,
          password: r.password,
          row_number: r.rowNumber,
        })),
      };

      const res = await axiosBrowser.post<ApiResponse<ImportResult>>("/api/admin/cards/import", payload);

      const summary = res.data?.data || null;
      setImportSummary(summary);

      // Mark duplicates returned by backend (in_db + in_file)
      if (summary?.duplicates) {
        const dupDbSet = new Set(summary.duplicates.in_db.map((d) => d.username));
        const dupFileSet = new Set(summary.duplicates.in_file.map((d) => d.username));

        setParsedData((prev) =>
          prev.map((r) => ({
            ...r,
            dupInDb: dupDbSet.has(r.username.trim()),
            dupInFile: r.dupInFile || dupFileSet.has(r.username.trim()),
          }))
        );
      }

      const created = summary?.created ?? 0;
      const skipped = summary?.skipped ?? 0;

      setResult({
        success: true,
        message:
          skipped > 0
            ? `تم الاستيراد مع تجاوز ${skipped} صف (مكرر/غير صالح).`
            : `تم إضافة ${created} بطاقة بنجاح`,
      });
    } catch (err: any) {
      setResult({ success: false, message: extractErrorMessage(err) });
    } finally {
      setIsUploading(false);
    }
  };

  const stats = useMemo(() => {
    const total = parsedData.length;
    const dupFile = parsedData.filter((r) => r.dupInFile).length;
    const dupDb = parsedData.filter((r) => r.dupInDb).length;
    const clean = parsedData.filter((r) => !r.dupInFile && !r.dupInDb).length;
    return { total, dupFile, dupDb, clean };
  }, [parsedData]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">رفع بطاقات من Excel</h1>
        <p className="mt-2 text-muted-foreground">استيراد بطاقات الإنترنت من ملف Excel</p>
      </div>

      {loadError && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-800">
          <AlertCircle className="h-5 w-5" />
          {loadError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع الملف
            </CardTitle>
            <CardDescription>يدعم الأعمدة: Username / Password</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>اختر الباقة</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage} disabled={packagesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={packagesLoading ? "جاري تحميل الباقات..." : "اختر باقة"} />
                </SelectTrigger>

                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={String(pkg.id)} value={String(pkg.id)}>
                      ₪ {pkg.name_ar} - {pkg.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {packagesLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري جلب الباقات النشطة...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>ملف Excel</Label>
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
              >
                {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                {result.message}
              </div>
            )}

            {importSummary && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span>تم إدخال</span>
                  <span className="font-bold">{importSummary.created}</span>
                </div>
                <div className="flex justify-between">
                  <span>تم تجاوز</span>
                  <span className="font-bold">{importSummary.skipped}</span>
                </div>
                <div className="flex justify-between">
                  <span>مكرر داخل الملف</span>
                  <span className="font-bold">{importSummary.duplicates.in_file.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>مكرر داخل قاعدة البيانات</span>
                  <span className="font-bold">{importSummary.duplicates.in_db.length}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={isUploading || parsedData.length === 0 || packagesLoading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جارٍ الرفع...
                </>
              ) : (
                <>
                  <Upload className="ml-2 h-4 w-4" />
                  رفع البطاقات
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              معاينة البيانات
            </CardTitle>
            <CardDescription>
              {parsedData.length > 0
                ? `تم قراءة ${stats.total} بطاقة — سليمة: ${stats.clean} — مكرر بالملف: ${stats.dupFile} — موجودة بالقاعدة: ${stats.dupDb}`
                : "لم يتم اختيار ملف بعد"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {parsedData.length > 0 ? (
              <div className="max-h-96 overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="p-2 text-right">صف</th>
                      <th className="p-2 text-right">اسم المستخدم</th>
                      <th className="p-2 text-right">كلمة المرور</th>
                      <th className="p-2 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 80).map((row, i) => {
                      const isDupFile = !!row.dupInFile;
                      const isDupDb = !!row.dupInDb;

                      let trClass = "border-t";
                      let statusText = "سليم";

                      if (isDupDb) {
                        trClass += " bg-red-50";
                        statusText = "موجود مسبقًا في قاعدة البيانات";
                      } else if (isDupFile) {
                        trClass += " bg-yellow-50";
                        statusText = "مكرر داخل الملف";
                      }

                      return (
                        <tr key={i} className={trClass}>
                          <td className="p-2">{row.rowNumber}</td>
                          <td className="p-2">
                            <code className="rounded bg-muted px-1">{row.username}</code>
                          </td>
                          <td className="p-2">
                            <code className="rounded bg-muted px-1">{row.password}</code>
                          </td>
                          <td className="p-2">
                            <span
                              className={
                                isDupDb ? "text-red-700" : isDupFile ? "text-yellow-800" : "text-green-700"
                              }
                            >
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {parsedData.length > 80 && (
                  <p className="p-2 text-center text-sm text-muted-foreground">
                    وأخرى {parsedData.length - 80} بطاقة...
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="mb-4 h-12 w-12" />
                <p>اختر ملف Excel لمعاينة البيانات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>تنسيق الملف المطلوب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-2 text-sm">الأعمدة المدعومة:</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-right">Username</th>
                  <th className="p-2 text-right">Password</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">390651865232</td>
                  <td className="p-2">134134</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              يمكن استخدام العربية أيضًا: "اسم المستخدم" و "كلمة المرور"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
