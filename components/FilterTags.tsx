'use client'

import { useState } from 'react'

const filterOptions = [
  '인모드리프팅',
  '슈링크리프팅',
  '슈링크유니버스',
  '코재수술',
  '보톡스',
  '필러',
]

export default function FilterTags() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-primary-main text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}

