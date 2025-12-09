'use client'

import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import SearchModal from './SearchModal'

export default function SearchSection() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <div className="space-y-3 mb-4">
        {/* Search input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <FiSearch className="text-primary-main text-lg" />
          </div>
          <input
            type="text"
            placeholder="검색어를 입력해주세요."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent cursor-pointer"
            onClick={() => setIsSearchOpen(true)}
            readOnly
          />
        </div>
      </div>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

