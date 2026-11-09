"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { AlertIcon } from "@/components/icons";
import { RetryableError } from "@/components/retryable-error";
import { getCompanyOptions } from "@/lib/api/companies";
import { isApiStatus } from "@/lib/api/http";
import type { Company } from "@/lib/api/schema";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import {
  conflictingFields,
  rebaseDraft,
  toDraft,
  toRequestBody,
  type DraftField,
  type FieldMap,
} from "./company-draft";
import { CompanyForm, type DraftChange } from "./company-form";
import { useUpdateCompany } from "./use-company-mutations";

type EditCompanyPanelProps = {
  id: string;
  onNotice: (notice: MessageKey | null) => void;
};

export function EditCompanyPanel({ id, onNotice }: EditCompanyPanelProps) {
  const { t } = useI18n();
  const query = useQuery(getCompanyOptions(id));

  // Data first: a failed reload must not take away a form the user is typing in.
  if (query.data) {
    return <EditCompanyForm company={query.data} onNotice={onNotice} />;
  }
  if (query.isPending) {
    return <DrawerSkeleton label={t("drawer.loading")} />;
  }
  if (isApiStatus(query.error, 404)) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-700"
      >
        {t("drawer.notFound")}
      </p>
    );
  }
  return (
    <RetryableError
      message={t("drawer.error")}
      isRetrying={query.isFetching}
      onRetry={() => void query.refetch()}
    />
  );
}

function DrawerSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="text-sm text-slate-600">
        {label}
      </p>
      {[0, 1, 2].map((block) => (
        <div
          key={block}
          aria-hidden
          className="h-16 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

type ConflictPhase =
  | { name: "none" }
  | { name: "detected" }
  | { name: "loading" }
  | { name: "load-failed" }
  /** `previous` is the version the failed save was based on. */
  | { name: "reloaded"; previous: Company };

type EditCompanyFormProps = {
  company: Company;
  onNotice: (notice: MessageKey | null) => void;
};

function EditCompanyForm({ company, onNotice }: EditCompanyFormProps) {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();
  const update = useUpdateCompany(company.id);
  const alertRef = useRef<HTMLDivElement>(null);

  // A snapshot, deliberately not kept in sync with the query: if_version has
  // to be the version the user actually saw, not whatever arrived since.
  const [base, setBase] = useState(company);
  const [draft, setDraft] = useState(() => toDraft(company));
  const [conflict, setConflict] = useState<ConflictPhase>({ name: "none" });

  const handleChange: DraftChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    // Only ever a settled error: resetting a pending save would detach it, and
    // its result, including the new version, would never reach this form.
    if (update.isError) update.reset();
    onNotice(null);
  };

  function handleSubmit() {
    const submitted = draft;
    update.mutate(
      { if_version: base.version, ...toRequestBody(submitted) },
      {
        onSuccess: (updated) => {
          setBase(updated);
          // Keeps anything typed while the save was on its way.
          setDraft((current) =>
            rebaseDraft(current, submitted, toDraft(updated)),
          );
          setConflict({ name: "none" });
          onNotice("form.saved");
        },
        onError: (error) => {
          if (isApiStatus(error, 409)) setConflict({ name: "detected" });
          onNotice(null);
        },
      },
    );
  }

  async function handleLoadLatest() {
    setConflict({ name: "loading" });
    try {
      const latest = await queryClient.fetchQuery(
        getCompanyOptions(company.id),
      );
      // A functional update: the user may have kept typing during the fetch.
      setDraft((current) =>
        rebaseDraft(current, toDraft(base), toDraft(latest)),
      );
      setBase(latest);
      setConflict({ name: "reloaded", previous: base });
      update.reset();
      alertRef.current?.focus();
    } catch {
      setConflict({ name: "load-failed" });
    }
  }

  function latestValueHints(previous: Company): FieldMap<string> {
    const label = (field: DraftField): string => {
      if (field === "status") return t(`status.${base.status}`);
      return base[field] || t("form.empty");
    };
    const fields = conflictingFields(draft, toDraft(previous), toDraft(base));
    return Object.fromEntries(
      fields.map((field) => [
        field,
        t("conflict.latestValue", { value: label(field) }),
      ]),
    );
  }

  const isConflictUnresolved =
    conflict.name === "detected" ||
    conflict.name === "loading" ||
    conflict.name === "load-failed";

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4">
        <Detail label={t("detail.created")}>
          {formatDate(base.created_at)}
        </Detail>
        <Detail label={t("detail.updated")}>
          {formatDate(base.updated_at)}
        </Detail>
        <Detail label={t("detail.version")}>{base.version}</Detail>
      </dl>

      <CompanyForm
        draft={draft}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel={t("form.save")}
        isSubmitting={update.isPending}
        isSubmitBlocked={isConflictUnresolved}
        // A conflict has its own banner; it is not a generic save failure.
        saveError={isApiStatus(update.error, 409) ? null : update.error}
        hints={
          conflict.name === "reloaded"
            ? latestValueHints(conflict.previous)
            : undefined
        }
        alertRef={alertRef}
        banner={
          <ConflictBanner
            phase={conflict.name}
            onLoadLatest={() => void handleLoadLatest()}
          />
        }
      />
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900 tabular-nums">
        {children}
      </dd>
    </div>
  );
}

const CONFLICT_MESSAGES = {
  detected: "conflict.detected",
  loading: "conflict.detected",
  "load-failed": "conflict.loadFailed",
  reloaded: "conflict.reloaded",
} as const;

function ConflictBanner({
  phase,
  onLoadLatest,
}: {
  phase: ConflictPhase["name"];
  onLoadLatest: () => void;
}) {
  const { t } = useI18n();
  if (phase === "none") return null;

  const isLoading = phase === "loading";
  return (
    <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <AlertIcon className="mt-0.5 size-4 text-amber-600" />
      <div className="flex flex-col items-start gap-2">
        <p>{t(CONFLICT_MESSAGES[phase])}</p>
        {phase !== "reloaded" && (
          <Button size="sm" isInactive={isLoading} onClick={onLoadLatest}>
            {t(isLoading ? "conflict.loading" : "conflict.load")}
          </Button>
        )}
      </div>
    </div>
  );
}
