'use client'

import { FiArrowUp, FiMessageCircle, FiEye, FiHeart } from 'react-icons/fi'
import { useState, useEffect } from 'react'

interface ReviewPost {
  id: number
  category: string
  username: string
  avatar: string
  content: string
  images?: string[]
  timestamp: string
  edited?: boolean
  upvotes: number
  comments: number
  views: number
  likes?: number
}

const reviewPosts: ReviewPost[] = [
  {
    id: 1,
    category: '자유수다',
    username: '베소통리소',
    avatar: '🐹',
    content: '원래 눈 라인이 마음에 들지 않아서 재수술을 고민하게 되었어요 첫 수술로 잡았던 라인이 너무 낮기도 하고 여전히 눈매가 흐릿해... 자연스럽게 바꾸고 싶다는 생각이 들었네...더 보기',
    images: ['eye1', 'eye2', 'eye3', 'eye4'],
    timestamp: '18시간 전',
    edited: true,
    upvotes: 62,
    comments: 198,
    views: 5722,
  },
  {
    id: 2,
    category: '자유수다',
    username: '홀짝댄스',
    avatar: '🐱',
    content: '비티에서 윤곽3종이랑 무보형물로 코수술 하고 왔당 ㅎㅎㅎㅎ 코는 이승호원장님, 윤곽...더 보기',
    images: ['face1', 'face2'],
    timestamp: '1일 전',
    edited: true,
    upvotes: 29,
    comments: 58,
    views: 2648,
  },
  {
    id: 3,
    category: '자유수다',
    username: '연말부뉘기',
    avatar: '🐧',
    content: '테이아의원 울쎄라 리프팅 받고 온 후기 남겨봅니다~~ >< 요즘 턱선이 흐려지고 팔자 쪽...더 보기',
    timestamp: '1일 전',
    upvotes: 30,
    comments: 45,
    views: 1820,
  },
  {
    id: 4,
    category: '자유수다',
    username: '춤추는아미고',
    avatar: '🦊',
    content: '와.. 티타늄 맛집은 테이아였네?? ;; 나 요즘 턱선이랑 볼살이 너무 축 처져서 테이아의원에서 티타늄리프팅 받아봤거...더 보기',
    images: ['before', 'after'],
    timestamp: '1일 전',
    edited: true,
    upvotes: 29,
    comments: 50,
    views: 2604,
  },
  {
    id: 5,
    category: '후기',
    username: '뷰티러버',
    avatar: '✨',
    content: '강남역 근처 클리닉에서 리쥬란 힐러 받고 왔어요! 처음 받아보는 거라 조금 걱정됐는데 원장님이 친절하게 설명해주셔서 안심이 됐네요. 시술 후 관리도 꼼꼼히 알려주셨어요...더 보기',
    images: ['skin1', 'skin2'],
    timestamp: '2일 전',
    upvotes: 45,
    comments: 72,
    views: 3200,
    likes: 120,
  },
  {
    id: 6,
    category: '후기',
    username: '민트향기',
    avatar: '🌿',
    content: '사각턱 때문에 고민이 많았는데 보톡스로 해결했어요! 가격도 합리적이고 효과도 좋아서 추천하고 싶네요. 3개월 정도 지나니까 더 자연스러워졌어요...더 보기',
    timestamp: '3일 전',
    upvotes: 38,
    comments: 55,
    views: 2100,
  },
]

export default function ReviewList() {
  const [savedReviews, setSavedReviews] = useState<ReviewPost[]>([])

  useEffect(() => {
    const loadReviews = () => {
      const reviews = JSON.parse(localStorage.getItem('reviews') || '[]')
      const formattedReviews = reviews.map((review: any) => ({
        id: review.id,
        category: review.category || '후기',
        username: review.username || '사용자',
        avatar: review.avatar || '👤',
        content: review.content,
        images: review.images,
        timestamp: review.timestamp || '방금 전',
        edited: false,
        upvotes: review.upvotes || 0,
        comments: review.comments || 0,
        views: review.views || 0,
        likes: review.likes,
      }))
      setSavedReviews(formattedReviews)
    }

    loadReviews()
    window.addEventListener('reviewAdded', loadReviews)
    return () => window.removeEventListener('reviewAdded', loadReviews)
  }, [])

  const allReviews = [...savedReviews, ...reviewPosts]

  return (
    <div className="px-4 space-y-4 pb-4">
      {allReviews.map((post) => (
        <div
          key={post.id}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          {/* Category Tag */}
          <div className="mb-3">
            <span className="bg-primary-light/20 text-primary-main px-3 py-1 rounded-full text-xs font-medium">
              {post.category}
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
              {post.avatar}
            </div>
            <span className="text-sm font-semibold text-gray-900">{post.username}</span>
          </div>

          {/* Post Content */}
          <p className="text-gray-800 text-sm mb-3 leading-relaxed line-clamp-3">
            {post.content}
          </p>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className={`grid gap-2 mb-3 ${
              post.images.length === 1 ? 'grid-cols-1' :
              post.images.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {post.images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden ${
                    post.images!.length === 1 ? 'max-h-96' : ''
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    이미지
                  </div>
                  {idx === 3 && post.images!.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white font-semibold text-lg">
                      +{post.images!.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mb-3">
            {post.timestamp} {post.edited && '(수정됨)'}
          </p>

          {/* Engagement Metrics */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-gray-600">
              <FiArrowUp className="text-primary-main" />
              <span className="text-xs">{post.upvotes}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <FiMessageCircle className="text-primary-main" />
              <span className="text-xs">{post.comments}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <FiEye className="text-gray-400" />
              <span className="text-xs text-gray-400">{post.views.toLocaleString()}</span>
            </div>
            {post.likes && (
              <div className="flex items-center gap-1 text-gray-600 ml-auto">
                <FiHeart className="text-primary-main fill-primary-main" />
                <span className="text-xs">{post.likes}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

