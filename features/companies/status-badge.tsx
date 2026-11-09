"use client";

import type { CompanyStatus } from "@/lib/api/schema";
import { useI18n } from "@/lib/i18n/i18n-provider";

const STATUS_CLASSES: Record<CompanyStatus, string> = {
  new: "bg-sky-50 text-sky-800 ring-sky-600/20",
  researching: "bg-violet-50 text-violet-800 ring-violet-600/20",
  contacted: "bg-amber-50 text-amber-800 ring-amber-600/25",
  qualified: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  rejected: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  const { t } = useI18n();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[status]}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {t(`status.${status}`)}
    </span>
  );
}
