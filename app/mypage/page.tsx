'use client'

import { Suspense } from 'react'
import MyPage from '@/components/MyPage'

export default function MyPageRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white max-w-md mx-auto w-full flex items-center justify-center">Loading...</div>}>
      <MyPage />
    </Suspense>
  )
}

