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
    <div className="mx-auto flex max-w-sm flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">{t("signIn.title")}</h1>
      <p className="text-slate-600">{t("signIn.description")}</p>
      <SignInButton returnTo={safeReturnTo(returnTo)} />
    </div>
  );
}
