"use client";

import { Button } from "@/components/button";
import { useI18n } from "@/lib/i18n/i18n-provider";

type RetryableErrorProps = {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
};

export function RetryableError({
  message,
  isRetrying,
  onRetry,
}: RetryableErrorProps) {
  const { t } = useI18n();

  return (
    <div role="alert" className="flex flex-wrap items-center gap-3">
      <p>{message}</p>
      <Button isInactive={isRetrying} onClick={onRetry}>
        {t(isRetrying ? "common.retrying" : "common.retry")}
      </Button>
    </div>
  );
}
