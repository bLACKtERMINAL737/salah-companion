"use client";

import { useEffect, useState, type ComponentType } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { resolveContentOfTheDay, type ResolvedContent } from "../../lib/quran";
import { useSettings } from "../../context/SettingsContext";
import { GlassCard, Spinner } from "../ui/Primitives";

export function DailyCards() {
  const { t } = useSettings();
  const [verse, setVerse] = useState<ResolvedContent | null>(null);
  const [dua, setDua] = useState<ResolvedContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([resolveContentOfTheDay("verse"), resolveContentOfTheDay("dua")]).then(([v, d]) => {
      if (cancelled) return;
      setVerse(v);
      setDua(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ContentCard icon={BookOpen} title={t("dashboard.verseOfTheDay")} content={verse} loading={loading} offlineLabel={t("common.offline")} />
      <ContentCard icon={Sparkles} title={t("dashboard.duaOfTheDay")} content={dua} loading={loading} offlineLabel={t("common.offline")} />
    </div>
  );
}

function ContentCard({
  icon: Icon,
  title,
  content,
  loading,
  offlineLabel,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  content: ResolvedContent | null;
  loading: boolean;
  offlineLabel: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
        <Icon size={16} className="text-[var(--gold)]" />
        {title}
      </div>
      {loading ? (
        <Spinner size={22} />
      ) : content?.arabic ? (
        <>
          <p dir="rtl" style={{ fontFamily: "var(--font-arabic-display)" }} className="text-right text-xl leading-relaxed text-[var(--text-primary)]">
            {content.arabic}
          </p>
          <p className="mt-2 text-sm italic text-[var(--text-secondary)]">{`\u201c${content.translation}\u201d`}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {content.surahName} {content.reference}
          </p>
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          {content?.surahName} {content?.reference} {"\u2014"} {content?.theme ?? offlineLabel}
        </p>
      )}
    </GlassCard>
  );
}
