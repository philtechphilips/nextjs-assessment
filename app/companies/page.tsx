import { CompaniesScreen } from "@/features/companies/companies-screen";
import { getI18n } from "@/lib/i18n/server";

export default async function CompaniesPage() {
  const { t } = await getI18n();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">{t("companies.title")}</h1>
      <CompaniesScreen />
    </>
  );
}
