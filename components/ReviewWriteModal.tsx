'use client'

import { useState, useEffect } from 'react'
import { FiX, FiImage, FiStar } from 'react-icons/fi'
import { useLanguage } from '@/contexts/LanguageContext'
import { trackReviewStart, type EntrySource } from '@/lib/gtm'

interface ReviewWriteModalProps {
  isOpen: boolean
  onClose: () => void
  filterData?: {
    gender: string
    category: string
    rating: string
    distance: string
  }
  entrySource?: EntrySource // 이벤트 엔트리소스
}

interface ReviewData {
  id: number
  category: string
  username: string
  avatar: string
  content: string
  images?: string[]
  timestamp: string
  upvotes: number
  comments: number
  views: number
  rating?: number
  procedure?: string
  clinic?: string
}

export default function ReviewWriteModal({ isOpen, onClose, filterData, entrySource = "community" }: ReviewWriteModalProps) {
  const { t } = useLanguage()
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [procedure, setProcedure] = useState('')
  const [clinic, setClinic] = useState('')
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    if (filterData?.category && filterData.category !== 'All') {
      setProcedure(filterData.category)
    }
    if (filterData?.rating && filterData.rating !== 'All') {
      setRating(parseInt(filterData.rating))
    }
  }, [filterData])

  // 모달이 열릴 때 GTM 이벤트 발생
  useEffect(() => {
    if (isOpen) {
      trackReviewStart(entrySource);
    }
  }, [isOpen, entrySource])

  if (!isOpen) return null

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const newImages = files.map(file => URL.createObjectURL(file))
      setImages([...images, ...newImages].slice(0, 5))
    }
  }

  const handleSubmit = () => {
    if (!content.trim()) {
      alert(t('review.contentRequired'))
      return
    }

    const newReview: ReviewData = {
      id: Date.now(),
      category: '후기',
      username: '사용자',
      avatar: '👤',
      content: content,
      images: images.length > 0 ? images : undefined,
      timestamp: '방금 전',
      upvotes: 0,
      comments: 0,
      views: 0,
      rating: rating > 0 ? rating : undefined,
      procedure: procedure || undefined,
      clinic: clinic || undefined,
    }

    // 로컬 스토리지에 저장
    const existingReviews = JSON.parse(localStorage.getItem('reviews') || '[]')
    existingReviews.unshift(newReview)
    localStorage.setItem('reviews', JSON.stringify(existingReviews))

    // 이벤트 발생하여 최신글 업데이트
    window.dispatchEvent(new Event('reviewAdded'))

    alert(t('review.writeSuccess'))
    setContent('')
    setRating(0)
    setProcedure('')
    setClinic('')
    setImages([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md mx-auto bg-white rounded-2xl max-h-[90vh] overflow-y-auto pb-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">{t('review.writeTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="text-xl text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Procedure Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{t('review.procedureType')}</label>
            <input
              type="text"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder={t("placeholder.receivedProcedure")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
            />
          </div>

          {/* Clinic Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{t('review.hospitalClinic')}</label>
            <input
              type="text"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              placeholder={t("placeholder.hospitalClinicName")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{t('label.rating')}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2"
                >
                  <FiStar
                    className={`text-2xl ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Content */}
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{t('review.content')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("placeholder.reviewExperience")}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{t('review.photoAttachment')}</label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden">
                  <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                  >
                    <FiX className="text-xs" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-main transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <FiImage className="text-2xl text-gray-400" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold transition-colors hover:bg-gray-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-primary-main text-white py-3 rounded-lg font-semibold transition-colors hover:bg-[#2DB8A0]"
          >
            {t('common.writeComplete')}
          </button>
        </div>
      </div>
    </div>
  )
}

