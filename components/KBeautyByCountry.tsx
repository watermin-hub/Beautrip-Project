'use client'

import { FiHeart, FiStar } from 'react-icons/fi'

const countries = [
  { 
    id: 1, 
    country: '🇨🇳 중국', 
    procedure: '리쥬란 힐러',
    hospital: '강남비비의원',
    price: '12만원',
    rating: '9.8',
    reviewCount: '150+',
    translation: true,
  },
  { 
    id: 2, 
    country: '🇯🇵 일본', 
    procedure: '인모드 리프팅',
    hospital: '신사역 클리닉',
    price: '25만원',
    rating: '9.9',
    reviewCount: '89+',
    translation: true,
  },
  { 
    id: 3, 
    country: '🇺🇸 미국', 
    procedure: '슈링크 유니버스',
    hospital: '압구정 메디컬',
    price: '18만원',
    rating: '9.7',
    reviewCount: '234+',
    translation: true,
  },
  { 
    id: 4, 
    country: '🇹🇭 태국', 
    procedure: '보톡스',
    hospital: '홍대 의원',
    price: '8만원',
    rating: '9.6',
    reviewCount: '178+',
    translation: false,
  },
]

export default function KBeautyByCountry() {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900 px-4">국가별 인기 시술</h3>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-4">
        {countries.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            {/* Image Placeholder */}
            <div className="w-full h-40 bg-gradient-to-br from-primary-light/20 to-primary-main/30 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">{item.country.split(' ')[0]}</span>
              </div>
              <button className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full z-10 shadow-sm hover:bg-opacity-100 transition-colors">
                <FiHeart className="text-gray-400 text-lg" />
              </button>
            </div>

            {/* Card Content */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-900">{item.country}</span>
                  {item.translation && (
                    <span className="bg-primary-main/20 text-primary-main text-xs px-2 py-0.5 rounded-full font-medium">
                      통역 가능
                    </span>
                  )}
                </div>
              </div>
              <p className="font-semibold text-sm text-gray-900 mb-1">{item.procedure}</p>
              <p className="text-xs text-gray-600 mb-3">{item.hospital}</p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                  <span className="text-xs font-semibold text-gray-900">{item.rating}</span>
                  <span className="text-xs text-gray-500">({item.reviewCount})</span>
                </div>
                <span className="text-base font-bold text-primary-main">{item.price}</span>
              </div>
              <button className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                상세보기
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 mt-4">
        <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition-colors">
          국가별 인기 시술 더보기
        </button>
      </div>
    </div>
  )
}

