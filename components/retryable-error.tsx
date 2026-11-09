"use client";

import { Button } from "@/components/button";
import { AlertIcon } from "@/components/icons";
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
    <div role="alert" className="flex flex-col items-center gap-3 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertIcon className="size-6" />
      </span>
      <p className="text-sm text-slate-700">{message}</p>
      <Button size="sm" isInactive={isRetrying} onClick={onRetry}>
        {t(isRetrying ? "common.retrying" : "common.retry")}
      </Button>
    </div>
  );
}
