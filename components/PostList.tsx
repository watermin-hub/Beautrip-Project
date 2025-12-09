'use client'

import { FiArrowUp, FiMessageCircle, FiEye, FiHeart } from 'react-icons/fi'
import { useState, useEffect } from 'react'

interface Post {
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

const recommendedPosts: Post[] = [
  {
    id: 1,
    category: '정보공유',
    username: '뷰티매니아',
    avatar: '💎',
    content: '강남역 근처 추천 클리닉 리스트 공유해요! 가격대비 품질이 좋은 곳들만 골라봤어요. 특히 리쥬란 힐러 시술 받았을 때 만족도가 높았던 곳 위주로 정리했습니다...더 보기',
    images: ['clinic1', 'clinic2'],
    timestamp: '5시간 전',
    upvotes: 142,
    comments: 89,
    views: 8234,
    likes: 256,
  },
  {
    id: 2,
    category: '질문답변',
    username: '시술초보자',
    avatar: '🌱',
    content: '처음으로 보톡스 맞으려는데 어떤 클리닉이 좋을까요? 강남 지역 위주로 추천 부탁드려요. 가격도 궁금하고 부작용 걱정도 되네요...더 보기',
    timestamp: '8시간 전',
    upvotes: 98,
    comments: 156,
    views: 6452,
  },
  {
    id: 3,
    category: '정보공유',
    username: '스킨케어러버',
    avatar: '✨',
    content: '인모드 리프팅 전후 비교 사진 공유합니다! 3개월 차인데 효과가 정말 만족스러워요. 특히 턱선이 확실히 올라간 게 보이시나요? ...더 보기',
    images: ['before1', 'after1'],
    timestamp: '12시간 전',
    edited: true,
    upvotes: 203,
    comments: 234,
    views: 12345,
    likes: 512,
  },
  {
    id: 4,
    category: '자유수다',
    username: '코성형고민',
    avatar: '🎭',
    content: '코 재수술 고민 중인데 조언 구해요ㅠㅠ 첫 수술이 마음에 들지 않아서... 어떤 의원이 좋은지, 재수술 시 주의사항은 무엇인지 궁금합니다...더 보기',
    timestamp: '15시간 전',
    upvotes: 76,
    comments: 92,
    views: 5432,
  },
  {
    id: 5,
    category: '정보공유',
    username: '필러전문가',
    avatar: '💉',
    content: '2024년 필러 가격 정보 정리했어요! 지역별, 시술별로 비교해봤는데 참고하시면 좋을 것 같아요. 특히 리쥬란, 쥬베룩 가격대가 궁금하셨던 분들...더 보기',
    timestamp: '1일 전',
    edited: true,
    upvotes: 167,
    comments: 145,
    views: 9876,
    likes: 324,
  },
  {
    id: 6,
    category: '질문답변',
    username: '리프팅고민',
    avatar: '🌙',
    content: '울쎄라 vs 인모드 어떤 게 나을까요? 둘 다 받아보신 분들 의견 듣고 싶어요. 가격도 비교해주시면 감사하겠습니다! ...더 보기',
    timestamp: '1일 전',
    upvotes: 89,
    comments: 112,
    views: 7654,
  },
]

const latestPosts: Post[] = [
  {
    id: 1,
    category: '자유수다',
    username: '신규회원123',
    avatar: '🦋',
    content: '안녕하세요! 처음 가입했는데 정보가 많아서 좋네요. 앞으로 잘 부탁드려요~',
    timestamp: '방금 전',
    upvotes: 5,
    comments: 2,
    views: 123,
  },
  {
    id: 2,
    category: '질문답변',
    username: '궁금한이',
    avatar: '🤔',
    content: '리쥬란 힐러 시술 받은 지 일주일인데 아직 효과가 안 보여요. 정상인가요?',
    timestamp: '5분 전',
    upvotes: 3,
    comments: 8,
    views: 234,
  },
  {
    id: 3,
    category: '정보공유',
    username: '정보나눔',
    avatar: '📚',
    content: '강남역 신규 오픈한 클리닉 정보 공유해요! 오픈 기념 이벤트 진행 중이라고 하네요',
    timestamp: '10분 전',
    upvotes: 12,
    comments: 15,
    views: 456,
  },
  {
    id: 4,
    category: '자유수다',
    username: '시술러버',
    avatar: '💖',
    content: '오늘 보톡스 맞고 왔는데 얼굴이 좀 붓네요ㅠㅠ 정상인 거 맞죠? 첫 시술이라 걱정돼요',
    images: ['swollen1'],
    timestamp: '15분 전',
    upvotes: 7,
    comments: 12,
    views: 345,
  },
  {
    id: 5,
    category: '정보공유',
    username: '가격비교왕',
    avatar: '💰',
    content: '올해부터 필러 가격이 올랐다고 들었는데 실제로 어떠세요? 최근 시술 받으신 분들 가격 정보 공유해주세요!',
    timestamp: '20분 전',
    upvotes: 18,
    comments: 24,
    views: 567,
  },
  {
    id: 6,
    category: '질문답변',
    username: '초보자',
    avatar: '🌿',
    content: '눈 재수술 생각 중인데 어떤 의원 추천받을 수 있을까요? 첫 수술 실패한 경험이 있어서 더 신중하게 선택하고 싶어요',
    timestamp: '30분 전',
    upvotes: 9,
    comments: 18,
    views: 412,
  },
  {
    id: 7,
    category: '자유수다',
    username: '뷰티매니아',
    avatar: '💎',
    content: '오늘 클리닉 다녀왔는데 직원분들 친절하시고 분위기도 좋았어요! 만족스러운 시술이었습니다',
    timestamp: '45분 전',
    upvotes: 14,
    comments: 7,
    views: 389,
  },
  {
    id: 8,
    category: '정보공유',
    username: '리프팅전문가',
    avatar: '✨',
    content: '인모드 리프팅 시술 전 주의사항 정리해서 올려봅니다. 시술 받기 전에 꼭 확인하시면 좋을 것 같아요!',
    images: ['info1', 'info2'],
    timestamp: '1시간 전',
    edited: true,
    upvotes: 25,
    comments: 31,
    views: 892,
  },
]

const popularPosts: Post[] = [
  {
    id: 1,
    category: '정보공유',
    username: '인기작가',
    avatar: '🔥',
    content: '2024년 최고의 클리닉 랭킹 공유합니다! 직접 다녀본 곳들만 추천하는 리스트예요. 가격, 품질, 서비스 모두 고려해서 작성했습니다...더 보기',
    images: ['ranking1', 'ranking2', 'ranking3'],
    timestamp: '2일 전',
    edited: true,
    upvotes: 523,
    comments: 456,
    views: 45234,
    likes: 1245,
  },
  {
    id: 2,
    category: '후기',
    username: '만족러버',
    avatar: '⭐',
    content: '슈링크 유니버스 시술 받고 완전 만족해서 후기 남겨요! 효과가 정말 놀라웠고 원장님도 너무 친절하셨어요. 전후 사진 공유합니다! ...더 보기',
    images: ['before2', 'after2'],
    timestamp: '3일 전',
    edited: true,
    upvotes: 412,
    comments: 389,
    views: 38921,
    likes: 987,
  },
  {
    id: 3,
    category: '정보공유',
    username: '가격정보왕',
    avatar: '💎',
    content: '시술별 가격대 비교표 업데이트했습니다! 지역별, 클리닉별 가격 정보를 한눈에 비교할 수 있도록 정리했어요. 많은 분들께 도움이 되면 좋겠습니다...더 보기',
    timestamp: '4일 전',
    edited: true,
    upvotes: 387,
    comments: 298,
    views: 34123,
    likes: 756,
  },
  {
    id: 4,
    category: '자유수다',
    username: '화제의인물',
    avatar: '🎯',
    content: '이 클리닉 정말 추천합니다! 제가 받은 시술 중에서 최고였어요. 직원분들도 친절하고 시술도 깔끔하게 잘 끝났습니다. 여러분도 한번 가보세요! ...더 보기',
    timestamp: '5일 전',
    upvotes: 298,
    comments: 234,
    views: 28765,
    likes: 634,
  },
  {
    id: 5,
    category: '질문답변',
    username: '베테랑',
    avatar: '👑',
    content: '시술 관련 질문 받아요! 여러 번 경험한 입장에서 솔직하게 답변드리겠습니다. 어떤 질문이든 환영입니다~ ...더 보기',
    timestamp: '6일 전',
    upvotes: 267,
    comments: 512,
    views: 24567,
    likes: 523,
  },
  {
    id: 6,
    category: '정보공유',
    username: '리뷰마스터',
    avatar: '📸',
    content: '강남역 클리닉 투어 후기 올려요! 5곳을 직접 방문해서 비교해봤는데 각각의 특징과 장단점을 정리했습니다. 참고하시면 좋을 것 같아요...더 보기',
    images: ['tour1', 'tour2', 'tour3', 'tour4'],
    timestamp: '1주일 전',
    edited: true,
    upvotes: 445,
    comments: 367,
    views: 38945,
    likes: 892,
  },
]

export default function PostList({ activeTab }: { activeTab: 'recommended' | 'latest' | 'popular' }) {
  const [savedReviews, setSavedReviews] = useState<Post[]>([])

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

  let posts: Post[]
  if (activeTab === 'recommended') {
    posts = recommendedPosts
  } else if (activeTab === 'latest') {
    // 최신글에는 저장된 리뷰를 맨 위에 표시
    posts = [...savedReviews, ...latestPosts]
  } else {
    posts = popularPosts
  }

  return (
    <div className="px-4 space-y-4 pb-4">
      {posts.map((post) => (
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
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900">{post.username}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{post.timestamp}</span>
                {post.edited && (
                  <span className="text-xs text-gray-400">수정됨</span>
                )}
              </div>
            </div>
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors">
                <FiArrowUp className="text-lg" />
                <span className="text-xs font-medium">{post.upvotes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors">
                <FiMessageCircle className="text-lg" />
                <span className="text-xs font-medium">{post.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors">
                <FiEye className="text-lg" />
                <span className="text-xs font-medium">{post.views}</span>
              </button>
              {post.likes && (
                <button className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors">
                  <FiHeart className="text-lg" />
                  <span className="text-xs font-medium">{post.likes}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
