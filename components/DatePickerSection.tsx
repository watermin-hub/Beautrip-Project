'use client'

import { useState } from 'react'
import { FiCalendar } from 'react-icons/fi'
import { IoChevronDown } from 'react-icons/io5'

export default function DatePickerSection() {
  const [selectedDate, setSelectedDate] = useState<string>('')

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <FiCalendar className="text-primary-main text-lg" />
      </div>
      <input
        type="text"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        placeholder="여행 일정을 선택해 주세요."
        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent cursor-pointer"
        onClick={() => {
          // 달력 팝업 열기 (실제 구현 시 달력 라이브러리 사용)
          const date = prompt('날짜를 선택해주세요 (YYYY-MM-DD)')
          if (date) setSelectedDate(date)
        }}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <IoChevronDown className="text-gray-400 text-lg" />
      </div>
    </div>
  )
}

