"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  recoveryGuideContent,
  type RecoveryGroupKey,
  type RecoveryGroupContent,
  type WeekContent,
} from "@/lib/content/recoveryGuideContent";

export default function RecoveryGuidePage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const groups = recoveryGuideContent[language] || recoveryGuideContent.KR;
  const [activeKey, setActiveKey] = useState<RecoveryGroupKey>("jaw");

  const active: RecoveryGroupContent = groups[activeKey] || groups.jaw;

  const groupEntries = Object.entries(groups) as [
    RecoveryGroupKey,
    RecoveryGroupContent
  ][];

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* 상단 제목 영역 */}
      <div className="sticky top-[48px] z-[101] bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-600"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {t("recovery.headerTitle")}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("recovery.headerSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <main className="px-4 pb-12 pt-16 space-y-6">
        {/* 그룹 선택 카드 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            {t("recovery.selectTitle")}
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            {t("recovery.selectSubtitle")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {groupEntries.map(([key, group]) => {
              const isActive = key === activeKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveKey(key)}
                  className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all ${
                    isActive
                      ? "border-primary-main bg-primary-main text-white shadow-md shadow-primary-main/20"
                      : "border-gray-200 bg-gray-50 text-gray-900 hover:border-primary-main/60 hover:bg-white"
                  }`}
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium mb-1 ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-white text-primary-main border border-primary-light/60"
                    }`}
                  >
                    {group.badge}
                  </span>
                  <p className="text-xs font-semibold leading-snug line-clamp-3">
                    {group.title}
                  </p>
                  <p
                    className={`mt-1 text-[11px] leading-snug ${
                      isActive ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {group.summary}
                  </p>
                  {group.recommended && (
                    <p
                      className={`mt-1 text-[11px] font-medium ${
                        isActive ? "text-emerald-100" : "text-emerald-700"
                      }`}
                    >
                      {group.recommended}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {active && (
            <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 px-3 py-2 text-[11px] text-gray-600">
              <p className="font-semibold text-gray-800">
                {t("recovery.currentGroup")}
              </p>
              <p className="mt-0.5 text-gray-900 text-xs">{active.title}</p>
              {active.recommended && (
                <p className="mt-0.5 text-emerald-700 font-medium">
                  {active.recommended}
                </p>
              )}
              <p className="mt-0.5">{active.summary}</p>
            </div>
          )}
        </section>

        {/* 상세 콘텐츠 */}
        <section className="space-y-6">
          <DetailSection group={active} />
        </section>
      </main>
    </div>
  );
}

function DetailSection({ group }: { group: RecoveryGroupContent }) {
  return (
    <article className="space-y-3">
      <SectionTitle
        title={group.title}
        recommended={group.recommended}
        procedures={group.procedures}
      />

      {group.weeks.map((week, idx) => (
        <WeekBlock key={idx} week={week} />
      ))}

      {group.summaryTitle && group.summaryBody && (
        <FamilySummary>
          <p className="font-semibold mb-1">{group.summaryTitle}</p>
          {group.summaryBody.map((line, idx) => (
            <p key={idx} className={idx === 0 ? "" : "mt-1"}>
              {line}
            </p>
          ))}
        </FamilySummary>
      )}

      {group.closingTitle && group.closingBody && (
        <FamilySummary>
          <p className="font-semibold mb-1">{group.closingTitle}</p>
          {group.closingBody.map((line, idx) => (
            <p key={idx} className={idx === 0 ? "" : "mt-1"}>
              {line}
            </p>
          ))}
        </FamilySummary>
      )}
    </article>
  );
}

function SectionTitle({
  title,
  recommended,
  procedures,
}: {
  title: string;
  recommended?: string;
  procedures?: string;
}) {
  return (
    <header className="space-y-2 mb-2">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {recommended && (
        <p className="text-sm font-semibold text-emerald-700">{recommended}</p>
      )}
      {procedures && (
        <p className="text-[11px] leading-relaxed text-gray-500 whitespace-pre-line rounded-xl bg-gray-50 px-3 py-2">
          {procedures}
        </p>
      )}
    </header>
  );
}

function WeekBlock({ week }: { week: WeekContent }) {
  const { t } = useLanguage();

  return (
    <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3 space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">{week.label}</h3>
      <p className="text-xs font-semibold text-gray-700">{week.subtitle}</p>
      <div className="mt-1 space-y-1.5 text-[11px] leading-relaxed text-gray-600">
        {week.description.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 text-[11px]">
        {week.tips.length > 0 && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2">
            <p className="font-semibold text-emerald-800 mb-1">
              {t("recovery.week.tipsTitle")}
            </p>
            <ul className="space-y-0.5 list-disc list-inside text-emerald-900">
              {week.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        {week.cautions.length > 0 && (
          <div className="rounded-xl bg-amber-50 px-3 py-2">
            <p className="font-semibold text-amber-800 mb-1">
              {t("recovery.week.cautionsTitle")}
            </p>
            <ul className="space-y-0.5 list-disc list-inside text-amber-900">
              {week.cautions.map((caution, idx) => (
                <li key={idx}>{caution}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {week.quote && (
        <div className="mt-2 rounded-xl bg-yellow-50 px-3 py-2 text-[11px] text-gray-900">
          “{week.quote}”
        </div>
      )}
    </section>
  );
}

function FamilySummary({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3 text-[11px] leading-relaxed text-sky-900">
      {children}
    </section>
  );
}
