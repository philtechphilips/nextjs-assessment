"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Drawer } from "@/components/drawer";
import { CloseIcon } from "@/components/icons";
import type { Company } from "@/lib/api/schema";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { CreateCompanyForm } from "./create-company-form";
import { EditCompanyPanel } from "./edit-company-panel";
import { NEW_COMPANY } from "./url-state";

type CompanyDrawerProps = {
  /** A company id, or NEW_COMPANY for create mode. */
  target: string;
  onClose: () => void;
  onCreated: (company: Company) => void;
};

export function CompanyDrawer({
  target,
  onClose,
  onCreated,
}: CompanyDrawerProps) {
  const { t } = useI18n();
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);
  const isCreating = target === NEW_COMPANY;

  return (
    <Drawer labelledBy={headingId} onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold tracking-tight outline-none"
        >
          {t(isCreating ? "drawer.createTitle" : "drawer.editTitle")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("drawer.close")}
          onClick={onClose}
        >
          <CloseIcon className="size-5" />
        </Button>
      </div>

      <div className="p-6">
        {/* Lives outside the panels so a notice survives the create-to-edit
            swap. Collapsed rather than hidden, to stay in the a11y tree. */}
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 empty:m-0 empty:p-0"
        >
          {notice && t(notice)}
        </p>

        {isCreating ? (
          <CreateCompanyForm
            onCreated={(company) => {
              setNotice("form.created");
              onCreated(company);
              // The form that had focus is about to be replaced.
              headingRef.current?.focus();
            }}
          />
        ) : (
          <EditCompanyPanel key={target} id={target} onNotice={setNotice} />
        )}
      </div>
    </Drawer>
  );
}
