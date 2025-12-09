'use client'

import FavoritesPage from '@/components/FavoritesPage'
import Header from '@/components/Header'
import BottomNavigation from '@/components/BottomNavigation'
import { FiArrowLeft } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Favorites() {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full pb-20">
      <Header />
      <div className="sticky top-[48px] z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FiArrowLeft className="text-gray-700 text-xl" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t("favorites.title")}</h1>
        <div className="w-10"></div>
      </div>
      <FavoritesPage />
      <BottomNavigation />
    </div>
  )
}

