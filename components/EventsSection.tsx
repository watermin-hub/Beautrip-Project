'use client'

import { useState } from 'react'

interface EventsSectionProps {
  selectedFilter: string
  onFilterChange: (filter: string) => void
}

const eventFilters = [
  { name: '전체', count: 19 },
  { name: '슈링크유니버스', count: 11 },
  { name: '인모드리프팅', count: 8 },
  { name: '슈링크리프팅', count: 8 },
]

const eventCards = [
  {
    id: 1,
    title: 'Eight longtime',
    tags: ['#인모드', '#슈링크'],
    price: '₩108,900',
    description: '1회 제임가',
    location: '',
  },
  {
    id: 2,
    title: 'Shurink Universe',
    subtitle: '본연 시그니처 슈링크 유니버스',
    price: '₩120,000',
    description: '300샷',
    location: '',
  },
  {
    id: 3,
    title: '슈링크유니버 울트라HF 300',
    price: '₩81,500',
    originalPrice: '₩120,000',
    description: '1회 체험',
    location: '서울 압구정역·에이트',
    badge: '에이트구니 체험권',
  },
]

export default function EventsSection({ selectedFilter, onFilterChange }: EventsSectionProps) {
  return (
    <div className="mb-6">
      {/* Section title */}
      <h2 className="text-lg font-bold mb-4 text-gray-900">
        unniLK...님이 찾고 있는 이벤트
      </h2>

      {/* Filter buttons */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {eventFilters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => onFilterChange(filter.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedFilter === filter.name
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.name} {filter.count}
          </button>
        ))}
      </div>

      {/* Event cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {eventCards.map((card) => (
          <div
            key={card.id}
            className="flex-shrink-0 w-72 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          >
            {/* Image placeholder */}
            <div className="w-full h-48 bg-gradient-to-br from-primary-light to-primary-main relative">
              {card.badge && (
                <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs font-medium text-primary-main">
                  {card.badge}
                </div>
              )}
            </div>

            {/* Card content */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
              {card.subtitle && (
                <p className="text-sm text-gray-600 mb-2">{card.subtitle}</p>
              )}
              <div className="flex gap-1 mb-2">
                {card.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs text-primary-main">{tag}</span>
                ))}
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg font-bold text-gray-900">{card.price}</span>
                {card.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {card.originalPrice}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-1">{card.description}</p>
              {card.location && (
                <p className="text-xs text-gray-500">{card.location}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

