"use client";

import { useSettings } from "../../context/SettingsContext";
import { AuthForm } from "../../components/auth/AuthForm";

export default function LoginPage() {
  const { t } = useSettings();
  return (
    <div className="space-y-6 py-8">
      <h1 className="font-display text-center text-2xl text-[var(--text-primary)]">{t("common.signIn")}</h1>
      <AuthForm />
    </div>
  );
}
