import { safeReturnTo } from "@/lib/auth/return-to";
import { getI18n } from "@/lib/i18n/server";
import { SignInButton } from "./sign-in-button";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const [{ t }, { returnTo }] = await Promise.all([getI18n(), searchParams]);

  return (
    <div className="mx-auto mt-12 flex max-w-sm flex-col gap-3 rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
      <h1 className="text-xl font-semibold tracking-tight">
        {t("signIn.title")}
      </h1>
      <p className="mb-3 text-sm text-slate-600">{t("signIn.description")}</p>
      <SignInButton returnTo={safeReturnTo(returnTo)} />
    </div>
  );
}
