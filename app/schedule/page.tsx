'use client'

import { Suspense } from 'react'
import MySchedulePage from '@/components/MySchedulePage'

export default function Schedule() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MySchedulePage />
    </Suspense>
  )
}

