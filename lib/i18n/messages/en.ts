export const en = {
  "companies.title": "Companies",

  "toolbar.search": "Search by name or domain",
  "toolbar.status": "Status",
  "toolbar.allStatuses": "All statuses",
  "toolbar.new": "New company",

  "table.name": "Name",
  "table.domain": "Domain",
  "table.status": "Status",
  "table.created": "Created",

  "list.results": "Results: {count}",
  "list.loading": "Loading companies…",
  "list.error": "The companies could not be loaded.",
  "list.empty": "There are no companies yet.",
  "list.noMatches": "No companies match your search or filter.",
  "list.clearFilters": "Clear filters",
  "list.pageEmpty": "This page has no companies.",
  "list.firstPage": "Go to the first page",

  "pagination.label": "Pagination",
  "pagination.previous": "Previous",
  "pagination.next": "Next",
  "pagination.pageOf": "Page {page} of {pages}",

  "status.new": "New",
  "status.researching": "Researching",
  "status.contacted": "Contacted",
  "status.qualified": "Qualified",
  "status.rejected": "Rejected",

  "drawer.createTitle": "New company",
  "drawer.editTitle": "Company details",
  "drawer.close": "Close",
  "drawer.loading": "Loading company…",
  "drawer.error": "The company could not be loaded.",
  "drawer.notFound": "This company does not exist.",

  "detail.created": "Created",
  "detail.updated": "Last updated",
  "detail.version": "Version",

  "form.name": "Name",
  "form.domain": "Domain",
  "form.status": "Status",
  "form.save": "Save changes",
  "form.create": "Create company",
  "form.saving": "Saving…",
  "form.saved": "Changes saved.",
  "form.created": "Company created.",
  "form.saveFailed": "Saving failed. Your input is still here, please try again.",
  "form.empty": "(empty)",

  "validation.nameRequired": "Enter a name.",

  "conflict.detected":
    "Someone else changed this company while you were editing. Your changes have not been saved.",
  "conflict.load": "Load latest version",
  "conflict.loading": "Loading latest version…",
  "conflict.loadFailed": "The latest version could not be loaded.",
  "conflict.reloaded":
    "The latest version is loaded and your edits are kept. Check them and save again.",
  "conflict.latestValue": "Latest saved value: {value}",

  "common.retry": "Try again",
  "common.retrying": "Trying again…",

  "language.label": "Language",

  "signIn.title": "Sign in",
  "signIn.description":
    "This demo has no real accounts. Signing in stores a token in this browser.",
  "signIn.submit": "Sign in",

  "routeError.title": "Something went wrong on this page.",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
