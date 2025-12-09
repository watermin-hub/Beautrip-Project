'use client'

const categories = [
  { icon: '👁️', label: '눈성형' },
  { icon: '👃', label: '코성형' },
  { icon: '😊', label: '안면윤곽/양악' },
  { icon: '💪', label: '가슴성형' },
  { icon: '🏃', label: '지방성형' },
  { icon: '💉', label: '필러' },
  { icon: '💉', label: '보톡스' },
  { icon: '✨', label: '리프팅' },
  { icon: '🌟', label: '피부' },
  { icon: '✂️', label: '제모' },
  { icon: '💇', label: '모발이식' },
  { icon: '🦷', label: '치아' },
  { icon: '🍵', label: '한방' },
  { icon: '📦', label: '기타' },
]

export default function CategoriesSection() {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900">카테고리로 찾기</h3>
      <div className="grid grid-cols-5 gap-4">
        {categories.map((category, index) => (
          <button
            key={index}
            className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="text-2xl">{category.icon}</div>
            <span className="text-xs text-gray-700 text-center leading-tight">
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

