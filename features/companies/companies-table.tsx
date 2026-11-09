"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { MouseEvent, ReactNode } from "react";
import { Button } from "@/components/button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SortableIcon,
} from "@/components/icons";
import { RetryableError } from "@/components/retryable-error";
import { listCompaniesOptions } from "@/lib/api/companies";
import type { Company, CompanySort } from "@/lib/api/schema";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { StatusBadge } from "./status-badge";
import {
  PAGE_SIZE,
  toListParams,
  type CompaniesUrlState,
} from "./url-state";

const COLUMN_COUNT = 4;
const HEADER_CELL_CLASS =
  "px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-600 uppercase";
const SKELETON_CLASS =
  "animate-pulse rounded bg-slate-100 motion-reduce:animate-none";

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
      <div className="overflow-x-auto">
        <table
          aria-busy={query.isFetching}
          className={`w-full min-w-208 table-fixed border-collapse text-left text-sm transition-opacity ${
            query.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          <caption className="sr-only">{t("companies.title")}</caption>
          {/* Fixed, so columns do not jump as the rows change under a filter. */}
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[28%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <SortableHeader
                field="name"
                label={t("table.name")}
                sort={state.sort}
                onSortChange={onSortChange}
              />
              <th scope="col" className={HEADER_CELL_CLASS}>
                {t("table.domain")}
              </th>
              <th scope="col" className={HEADER_CELL_CLASS}>
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

      <div className="flex flex-wrap items-center justify-between">
        {/* Collapsed rather than hidden: a live region must stay in the a11y tree. */}
        <p
          role="status"
          className="px-4 py-3 text-sm text-slate-600 tabular-nums empty:p-0"
        >
          {data
            ? t("list.results", { count: data.total })
            : query.isPending && t("list.loading")}
        </p>

        {data && data.items.length > 0 && (
          <nav
            aria-label={t("pagination.label")}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Button
              size="sm"
              isInactive={state.page <= 1}
              onClick={() => onPageChange(state.page - 1)}
            >
              <ChevronLeftIcon />
              {t("pagination.previous")}
            </Button>
            <span className="px-1 whitespace-nowrap text-slate-600 tabular-nums">
              {t("pagination.pageOf", { page: state.page, pages: totalPages })}
            </span>
            <Button
              size="sm"
              isInactive={state.page >= totalPages}
              onClick={() => onPageChange(state.page + 1)}
            >
              {t("pagination.next")}
              <ChevronRightIcon />
            </Button>
          </nav>
        )}
      </div>
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
    <th scope="col" aria-sort={direction} className={HEADER_CELL_CLASS}>
      <button
        type="button"
        onClick={() =>
          onSortChange(direction === "ascending" ? descending : field)
        }
        className={`group inline-flex items-center gap-1 tracking-wide uppercase transition-colors hover:text-slate-900 ${
          direction === "none" ? "" : "text-slate-900"
        }`}
      >
        {label}
        {direction === "ascending" && <ArrowUpIcon className="size-3.5" />}
        {direction === "descending" && <ArrowDownIcon className="size-3.5" />}
        {direction === "none" && (
          <SortableIcon className="size-3.5 text-slate-400 group-hover:text-slate-600" />
        )}
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
  const { formatDate } = useI18n();

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
      className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
    >
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600"
          >
            {/* Array.from splits by character, so an emoji stays whole. */}
            {Array.from(company.name.toUpperCase())[0]}
          </span>
          <a
            href={href}
            onClick={handleLinkClick}
            className="min-w-0 font-medium wrap-anywhere text-slate-900 hover:underline"
          >
            {company.name}
          </a>
        </div>
      </td>
      <td className="px-4 py-2 wrap-anywhere text-slate-600">
        {company.domain ?? "—"}
      </td>
      <td className="px-4 py-2">
        <StatusBadge status={company.status} />
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-slate-600 tabular-nums">
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
      <td colSpan={COLUMN_COUNT} className="px-4 py-14">
        {children}
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return Array.from({ length: PAGE_SIZE }, (_, row) => (
    <tr key={row} aria-hidden className="border-b border-slate-100">
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className={`size-7 shrink-0 ${SKELETON_CLASS}`} />
          <div className={`h-4 w-2/3 ${SKELETON_CLASS}`} />
        </div>
      </td>
      <td className="px-4 py-2">
        <div className={`h-4 w-3/4 ${SKELETON_CLASS}`} />
      </td>
      <td className="px-4 py-2">
        <div className={`h-5 w-20 ${SKELETON_CLASS}`} />
      </td>
      <td className="px-4 py-2">
        <div className={`h-4 w-24 ${SKELETON_CLASS}`} />
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
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <BuildingIcon className="size-6" />
      </span>
      <p className="text-sm text-slate-700">{message}</p>
      {children}
    </div>
  );
}
