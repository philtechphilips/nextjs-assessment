"use client";

import { useId } from "react";
import { Button } from "@/components/button";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/api/schema";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { SearchBox } from "./search-box";
import { isCompanyStatus } from "./url-state";

type CompaniesToolbarProps = {
  q: string;
  status: CompanyStatus | null;
  onSearch: (q: string) => void;
  onStatusChange: (status: CompanyStatus | null) => void;
  onCreate: () => void;
};

export function CompaniesToolbar({
  q,
  status,
  onSearch,
  onStatusChange,
  onCreate,
}: CompaniesToolbarProps) {
  const { t } = useI18n();
  const statusId = useId();

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <SearchBox label={t("toolbar.search")} value={q} onChange={onSearch} />
      <div className="flex flex-col gap-1">
        <label htmlFor={statusId} className="text-sm font-medium">
          {t("toolbar.status")}
        </label>
        <select
          id={statusId}
          value={status ?? ""}
          onChange={({ target: { value } }) =>
            onStatusChange(isCompanyStatus(value) ? value : null)
          }
          className="rounded border border-slate-300 px-3 py-1.5"
        >
          <option value="">{t("toolbar.allStatuses")}</option>
          {COMPANY_STATUSES.map((option) => (
            <option key={option} value={option}>
              {t(`status.${option}`)}
            </option>
          ))}
        </select>
      </div>
      <Button variant="primary" onClick={onCreate}>
        {t("toolbar.new")}
      </Button>
    </div>
  );
}
