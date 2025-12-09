'use client'

const interestProcedures = [
  '인모드리프팅',
  '슈링크리프팅',
  '슈링크유니버스',
  '코재수술',
  '아이슈링크',
]

export default function InterestProceduresSection() {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900">관심 시술로 찾기</h3>
      <div className="flex gap-2 flex-wrap">
        {interestProcedures.map((procedure, index) => (
          <button
            key={index}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {procedure}
          </button>
        ))}
      </div>
    </div>
  )
}

