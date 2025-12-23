'use client'

import { Suspense } from 'react'
import CommunityPage from '@/components/CommunityPage'
import { useLanguage } from '@/contexts/LanguageContext'

function LoadingFallback() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-500">{t("common.loading")}</div>
    </div>
  )
}

export default function Community() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CommunityPage />
    </Suspense>
  )
}

