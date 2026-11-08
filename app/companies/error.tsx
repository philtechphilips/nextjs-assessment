"use client";

import { Button } from "@/components/button";
import { useI18n } from "@/lib/i18n/i18n-provider";

// Query failures are handled inline; this only catches render errors.
export default function CompaniesError({ retry }: { retry: () => void }) {
  const { t } = useI18n();

  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p>{t("routeError.title")}</p>
      <Button onClick={() => retry()}>{t("common.retry")}</Button>
    </div>
  );
}
