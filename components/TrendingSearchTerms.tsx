'use client'

import { useState } from 'react'
import { FiTrendingUp } from 'react-icons/fi'

const trendingTerms = [
  { id: 1, term: '리쥬란 힐러', change: '+125%', isHot: true },
  { id: 2, term: '인모드 리프팅', change: '+89%', isHot: true },
  { id: 3, term: '슈링크 유니버스', change: '+67%', isHot: false },
  { id: 4, term: '보톡스', change: '+45%', isHot: false },
  { id: 5, term: '코 성형', change: '+32%', isHot: false },
]

export default function TrendingSearchTerms() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-6 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiTrendingUp className="text-primary-main" />
          급상승 인기검색어
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-main font-medium"
        >
          {isExpanded ? '접기' : '더보기'}
        </button>
      </div>
      <div className="space-y-2">
        {trendingTerms.slice(0, isExpanded ? trendingTerms.length : 3).map((item, index) => (
          <button
            key={item.id}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${index < 3 ? 'text-primary-main' : 'text-gray-400'}`}>
                {index + 1}
              </span>
              <span className="text-sm text-gray-900">{item.term}</span>
              {item.isHot && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  HOT
                </span>
              )}
            </div>
            <span className="text-xs text-green-600 font-medium">{item.change}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

