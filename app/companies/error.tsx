"use client";

import { RetryableError } from "@/components/retryable-error";
import { useI18n } from "@/lib/i18n/i18n-provider";

// Query failures are handled inline; this only catches render errors.
export default function CompaniesError({ retry }: { retry: () => void }) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 shadow-xs">
      <RetryableError
        message={t("routeError.title")}
        isRetrying={false}
        onRetry={() => retry()}
      />
    </div>
  );
}
