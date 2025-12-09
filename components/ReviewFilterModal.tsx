'use client'

import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import ReviewWriteModal from './ReviewWriteModal'

interface ReviewFilterModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReviewFilterModal({ isOpen, onClose }: ReviewFilterModalProps) {
  const [selectedGender, setSelectedGender] = useState<string>('All')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedRating, setSelectedRating] = useState<string>('All')
  const [selectedDistance, setSelectedDistance] = useState<string>('All')
  const [showWriteModal, setShowWriteModal] = useState(false)

  if (!isOpen) return null

  const handleApplyFilter = () => {
    setShowWriteModal(true)
  }

  const handleReset = () => {
    setSelectedGender('All')
    setSelectedCategory('All')
    setSelectedRating('All')
    setSelectedDistance('All')
  }

  const handleCloseWriteModal = () => {
    setShowWriteModal(false)
    onClose()
  }

  const genders = ['All', 'Male', 'Female', 'Others']
  const categories = ['All', '눈성형', '코성형', '리프팅', '피부', '보톡스/필러']
  const ratings = ['All', '5', '4', '3', '2', '1']
  const distances = ['All', '1 Km', '1-3 Km', '3-5 Km', '5 Km 이상']

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center">
        <div 
          className="w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up pb-20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-gray-900">Filter your Need</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="text-xl text-gray-700" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-6 space-y-6">
            {/* Gender Section */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">성별</label>
              <div className="flex gap-2 flex-wrap">
                {genders.map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedGender === gender
                        ? 'bg-primary-main text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {gender === 'All' ? '전체' : gender === 'Male' ? '남성' : gender === 'Female' ? '여성' : '기타'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Section */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">시술 카테고리</label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-main text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Section */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">평점</label>
              <div className="flex gap-2 flex-wrap">
                {ratings.map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedRating === rating
                        ? 'bg-primary-main text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rating !== 'All' && <span>⭐</span>}
                    {rating === 'All' ? '전체' : rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Section */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">거리</label>
              <div className="flex gap-2 flex-wrap">
                {distances.map((distance) => (
                  <button
                    key={distance}
                    onClick={() => setSelectedDistance(distance)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedDistance === distance
                        ? 'bg-primary-main text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {distance === 'All' ? '전체' : distance}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilter}
              className="flex-1 bg-primary-main text-white py-3 rounded-lg font-semibold transition-colors hover:bg-[#2DB8A0]"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {showWriteModal && (
        <ReviewWriteModal
          isOpen={showWriteModal}
          onClose={handleCloseWriteModal}
          filterData={{
            gender: selectedGender,
            category: selectedCategory,
            rating: selectedRating,
            distance: selectedDistance,
          }}
        />
      )}
    </>
  )
}

