"use client";

import { useState } from "react";
import type { Company } from "@/lib/api/schema";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { EMPTY_DRAFT, toRequestBody } from "./company-draft";
import { CompanyForm, type DraftChange } from "./company-form";
import { useCreateCompany } from "./use-company-mutations";

export function CreateCompanyForm({
  onCreated,
}: {
  onCreated: (company: Company) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const create = useCreateCompany();

  const handleChange: DraftChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    // Only ever a settled error: resetting a pending mutation would detach it.
    if (create.isError) create.reset();
  };

  return (
    <CompanyForm
      draft={draft}
      onChange={handleChange}
      onSubmit={() =>
        create.mutate(toRequestBody(draft), { onSuccess: onCreated })
      }
      submitLabel={t("form.create")}
      isSubmitting={create.isPending}
      saveError={create.error}
    />
  );
}
