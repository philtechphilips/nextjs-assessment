"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { MouseEvent, ReactNode } from "react";
import { Button } from "@/components/button";
import { RetryableError } from "@/components/retryable-error";
import { listCompaniesOptions } from "@/lib/api/companies";
import type { Company, CompanySort } from "@/lib/api/schema";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  PAGE_SIZE,
  toListParams,
  type CompaniesUrlState,
} from "./url-state";

const COLUMN_COUNT = 4;

type CompaniesTableProps = {
  state: CompaniesUrlState;
  companyHref: (id: string) => string;
  onOpenCompany: (id: string) => void;
  onSortChange: (sort: CompanySort) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
};

export function CompaniesTable({
  state,
  companyHref,
  onOpenCompany,
  onSortChange,
  onPageChange,
  onClearFilters,
}: CompaniesTableProps) {
  const { t } = useI18n();
  // keepPreviousData holds the current rows on screen while the next filter
  // or page loads, instead of dropping the table back to its loading state.
  const query = useQuery({
    ...listCompaniesOptions(toListParams(state)),
    placeholderData: keepPreviousData,
  });
  const { data } = query;
  const totalPages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1;

  return (
    <>
      <p role="status" className="mb-2 text-sm text-slate-600">
        {data
          ? t("list.results", { count: data.total })
          : query.isPending && t("list.loading")}
      </p>

      <div className="overflow-x-auto">
        <table
          aria-busy={query.isFetching}
          className={`w-full border-collapse text-left text-sm transition-opacity ${
            query.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          <caption className="sr-only">{t("companies.title")}</caption>
          <thead>
            <tr className="border-b border-slate-300">
              <SortableHeader
                field="name"
                label={t("table.name")}
                sort={state.sort}
                onSortChange={onSortChange}
              />
              <th scope="col" className="px-3 py-2 font-medium">
                {t("table.domain")}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {t("table.status")}
              </th>
              <SortableHeader
                field="created_at"
                label={t("table.created")}
                sort={state.sort}
                onSortChange={onSortChange}
              />
            </tr>
          </thead>
          <tbody>
            {query.isError && (
              <MessageRow>
                <RetryableError
                  message={t("list.error")}
                  isRetrying={query.isFetching}
                  onRetry={() => void query.refetch()}
                />
              </MessageRow>
            )}
            {query.isPending && <SkeletonRows />}
            {data?.items.map((company) => (
              <CompanyRow
                key={company.id}
                company={company}
                href={companyHref(company.id)}
                onOpen={onOpenCompany}
              />
            ))}
            {data?.items.length === 0 && (
              <MessageRow>
                <EmptyState
                  isOutOfRange={data.total > 0}
                  hasFilters={Boolean(state.q || state.status)}
                  onFirstPage={() => onPageChange(1)}
                  onClearFilters={onClearFilters}
                />
              </MessageRow>
            )}
          </tbody>
        </table>
      </div>

      {data && data.items.length > 0 && (
        <nav
          aria-label={t("pagination.label")}
          className="mt-4 flex items-center justify-end gap-3 text-sm"
        >
          <Button
            isInactive={state.page <= 1}
            onClick={() => onPageChange(state.page - 1)}
          >
            {t("pagination.previous")}
          </Button>
          <span>
            {t("pagination.pageOf", { page: state.page, pages: totalPages })}
          </span>
          <Button
            isInactive={state.page >= totalPages}
            onClick={() => onPageChange(state.page + 1)}
          >
            {t("pagination.next")}
          </Button>
        </nav>
      )}
    </>
  );
}

function SortableHeader({
  field,
  label,
  sort,
  onSortChange,
}: {
  field: "name" | "created_at";
  label: string;
  sort: CompanySort;
  onSortChange: (sort: CompanySort) => void;
}) {
  const descending = `-${field}` as const;
  const direction =
    sort === field ? "ascending" : sort === descending ? "descending" : "none";

  return (
    <th scope="col" aria-sort={direction} className="px-3 py-2 font-medium">
      <button
        type="button"
        onClick={() =>
          onSortChange(direction === "ascending" ? descending : field)
        }
        className="inline-flex items-center gap-1 hover:underline"
      >
        {label}
        <span aria-hidden className="w-3">
          {direction === "ascending" && "▲"}
          {direction === "descending" && "▼"}
        </span>
      </button>
    </th>
  );
}

function CompanyRow({
  company,
  href,
  onOpen,
}: {
  company: Company;
  href: string;
  onOpen: (id: string) => void;
}) {
  const { t, formatDate } = useI18n();

  // The link is the keyboard and screen-reader route into the drawer, and
  // still opens a new tab on ctrl/cmd/middle click. The row is a mouse target.
  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    onOpen(company.id);
  }

  return (
    <tr
      onClick={() => onOpen(company.id)}
      className="cursor-pointer border-b border-slate-200 hover:bg-slate-50"
    >
      <td className="px-3 py-2">
        <a
          href={href}
          onClick={handleLinkClick}
          className="font-medium hover:underline"
        >
          {company.name}
        </a>
      </td>
      <td className="px-3 py-2">{company.domain ?? "—"}</td>
      <td className="px-3 py-2">{t(`status.${company.status}`)}</td>
      <td className="px-3 py-2">
        <time dateTime={company.created_at}>
          {formatDate(company.created_at)}
        </time>
      </td>
    </tr>
  );
}

function MessageRow({ children }: { children: ReactNode }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} className="px-3 py-6">
        {children}
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return Array.from({ length: PAGE_SIZE }, (_, row) => (
    <tr key={row} aria-hidden className="border-b border-slate-200">
      <td colSpan={COLUMN_COUNT} className="px-3 py-2">
        <div className="h-5 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
      </td>
    </tr>
  ));
}

function EmptyState({
  isOutOfRange,
  hasFilters,
  onFirstPage,
  onClearFilters,
}: {
  isOutOfRange: boolean;
  hasFilters: boolean;
  onFirstPage: () => void;
  onClearFilters: () => void;
}) {
  const { t } = useI18n();

  if (isOutOfRange) {
    return (
      <EmptyMessage message={t("list.pageEmpty")}>
        <Button onClick={onFirstPage}>{t("list.firstPage")}</Button>
      </EmptyMessage>
    );
  }
  if (hasFilters) {
    return (
      <EmptyMessage message={t("list.noMatches")}>
        <Button onClick={onClearFilters}>{t("list.clearFilters")}</Button>
      </EmptyMessage>
    );
  }
  return <EmptyMessage message={t("list.empty")} />;
}

function EmptyMessage({
  message,
  children,
}: {
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p>{message}</p>
      {children}
    </div>
  );
}
