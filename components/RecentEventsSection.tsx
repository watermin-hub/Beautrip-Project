'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from "@/contexts/LanguageContext"

interface PopularReview {
  id: number
  title: string
  nickname: string
  procedure: string
  clinic: string
  likes: number
}

const popularReviews: PopularReview[] = [
  {
    id: 1,
    title: '3박 4일 일정으로 슈링크 유니버스 받고 왔어요!',
    nickname: '솜솜**',
    procedure: '슈링크 유니버스',
    clinic: '서울 강남 · 본연의원',
    likes: 128,
  },
  {
    id: 2,
    title: '인모드 리프팅 + 리쥬란 힐러 조합 후기',
    nickname: '리프팅덕후',
    procedure: '인모드 리프팅, 리쥬란 힐러',
    clinic: '서울 압구정 · 에이의원',
    likes: 97,
  },
  {
    id: 3,
    title: '코 성형 6개월차, 회복 기간 진짜 이랬어요',
    nickname: '코코***',
    procedure: '코 성형',
    clinic: '서울 역삼 · 디에이병원',
    likes: 83,
  },
]

export default function RecentEventsSection() {
  const router = useRouter()
  const { t } = useLanguage()

  const handleClick = () => {
    router.push('/community?tab=review')
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{t("home.trendingBeforeAfter")}</h3>
        <button
          onClick={handleClick}
          className="text-xs text-primary-main font-medium"
        >
          {t("home.more")} &gt;
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {popularReviews.map((review) => (
          <button
            key={review.id}
            onClick={handleClick}
            className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm text-left"
          >
            {/* 비포&애프터 이미지 영역 */}
            <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative">
              <div className="absolute inset-0 flex">
                <div className="flex-1 p-2">
                  <div className="w-full h-full bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-xs text-gray-400 font-medium">BEFORE</span>
                  </div>
                </div>
                <div className="flex-1 p-2">
                  <div className="w-full h-full bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-xs text-gray-400 font-medium">AFTER</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3">
              <p className="text-gray-900 font-semibold text-sm line-clamp-2 mb-1">
                {review.title}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                {review.nickname} · {review.procedure}
              </p>
              <p className="text-gray-500 text-xs mb-2 line-clamp-1">
                {review.clinic}
              </p>
              <p className="text-primary-main font-semibold text-xs">
                ❤ {review.likes.toLocaleString()}명이 도움됐다고 했어요
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

