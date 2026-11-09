"use client";

import { useId } from "react";
import { Button } from "@/components/button";
import { PlusIcon } from "@/components/icons";
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
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
      <SearchBox label={t("toolbar.search")} value={q} onChange={onSearch} />
      <div className="w-full sm:w-44">
        <label htmlFor={statusId} className="sr-only">
          {t("toolbar.status")}
        </label>
        <select
          id={statusId}
          value={status ?? ""}
          onChange={({ target: { value } }) =>
            onStatusChange(isCompanyStatus(value) ? value : null)
          }
          className="control control-select"
        >
          <option value="">{t("toolbar.allStatuses")}</option>
          {COMPANY_STATUSES.map((option) => (
            <option key={option} value={option}>
              {t(`status.${option}`)}
            </option>
          ))}
        </select>
      </div>
      <Button variant="primary" onClick={onCreate} className="w-full sm:w-auto">
        <PlusIcon />
        {t("toolbar.new")}
      </Button>
    </div>
  );
}
