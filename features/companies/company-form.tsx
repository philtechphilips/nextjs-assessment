"use client";

import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/button";
import { COMPANY_STATUSES } from "@/lib/api/schema";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  parseValidationFailure,
  validateDraft,
  type CompanyDraft,
  type DraftField,
  type FieldMap,
} from "./company-draft";
import { isCompanyStatus } from "./url-state";

export type DraftChange = <F extends DraftField>(
  field: F,
  value: CompanyDraft[F],
) => void;

type CompanyFormProps = {
  draft: CompanyDraft;
  onChange: DraftChange;
  /** Called only when the draft passes client-side validation. */
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  isSubmitBlocked?: boolean;
  saveError: unknown;
  /** Shown under a field, e.g. the latest saved value after a conflict. */
  hints?: FieldMap<string>;
  banner?: ReactNode;
  alertRef?: Ref<HTMLDivElement>;
};

const CONTROL_CLASS =
  "w-full rounded border border-slate-300 px-3 py-1.5 aria-invalid:border-red-600";

export function CompanyForm({
  draft,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  isSubmitBlocked = false,
  saveError,
  hints = {},
  banner,
  alertRef,
}: CompanyFormProps) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [isValidationShown, setIsValidationShown] = useState(false);

  const validationFailure = parseValidationFailure(saveError);
  const formMessage = !saveError
    ? null
    : validationFailure
      ? validationFailure.other.join(" ")
      : t("form.saveFailed");

  const clientErrors = isValidationShown ? validateDraft(draft) : {};
  function errorFor(field: DraftField): string | undefined {
    const key = clientErrors[field];
    return key ? t(key) : validationFailure?.fields[field];
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || isSubmitBlocked) return;

    if (Object.keys(validateDraft(draft)).length > 0) {
      // Rendered synchronously so the focused field already has its error.
      flushSync(() => setIsValidationShown(true));
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
      return;
    }
    onSubmit();
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      {/* Stays mounted: live regions only announce changes to their content. */}
      <div
        ref={alertRef}
        role="alert"
        tabIndex={-1}
        className="outline-none empty:hidden"
      >
        {banner}
        {formMessage && <p className="text-red-700">{formMessage}</p>}
      </div>

      <Field
        label={t("form.name")}
        error={errorFor("name")}
        hint={hints.name}
        render={(controlProps) => (
          <input
            {...controlProps}
            required
            value={draft.name}
            onChange={(event) => onChange("name", event.target.value)}
            className={CONTROL_CLASS}
          />
        )}
      />

      <Field
        label={t("form.domain")}
        error={errorFor("domain")}
        hint={hints.domain}
        render={(controlProps) => (
          <input
            {...controlProps}
            value={draft.domain}
            onChange={(event) => onChange("domain", event.target.value)}
            className={CONTROL_CLASS}
          />
        )}
      />

      <Field
        label={t("form.status")}
        error={errorFor("status")}
        hint={hints.status}
        render={(controlProps) => (
          <select
            {...controlProps}
            value={draft.status}
            onChange={({ target: { value } }) => {
              if (isCompanyStatus(value)) onChange("status", value);
            }}
            className={CONTROL_CLASS}
          >
            {COMPANY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        )}
      />

      <Button
        type="submit"
        variant="primary"
        isInactive={isSubmitting || isSubmitBlocked}
        className="self-start"
      >
        {isSubmitting ? t("form.saving") : submitLabel}
      </Button>
    </form>
  );
}

type ControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FieldProps = {
  label: string;
  error: string | undefined;
  hint: string | undefined;
  render: (controlProps: ControlProps) => ReactNode;
};

function Field({ label, error, hint, render }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {render({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy || undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-amber-800">
          {hint}
        </p>
      )}
    </div>
  );
}
