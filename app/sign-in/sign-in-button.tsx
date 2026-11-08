"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { signIn } from "@/lib/auth/session";
import { useI18n } from "@/lib/i18n/i18n-provider";

export function SignInButton({ returnTo }: { returnTo: string }) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <Button
      variant="primary"
      onClick={() => {
        signIn("demo-token");
        router.replace(returnTo);
      }}
    >
      {t("signIn.submit")}
    </Button>
  );
}
