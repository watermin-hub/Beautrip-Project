'use client'

import { useState } from 'react'
import { FiX, FiArrowRight } from 'react-icons/fi'

interface AISkinAnalysisConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onAgree: () => void
}

export default function AISkinAnalysisConsentModal({
  isOpen,
  onClose,
  onAgree,
}: AISkinAnalysisConsentModalProps) {
  const [isAgreed, setIsAgreed] = useState(false)

  if (!isOpen) return null

  const handleAgree = () => {
    setIsAgreed(true)
    onAgree()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">AI 피부 분석 테스트</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiX className="text-gray-700 text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          <p className="text-center text-sm text-gray-600 mb-4">
            테스트의 총 소요시간은 <strong className="text-gray-900">3분</strong>입니다.
          </p>

          <div className="text-center text-xs text-gray-700 mb-4 leading-relaxed">
            여러분의 얼굴을 촬영한 후 AI 기능을 통해 분석을 시작합니다.<br />
            얼굴 사진 촬영에 동의하신다면 아래 '동의'를 클릭해 주세요.<br />
            세부 내용은 아래에서 확인하시기 바랍니다.
          </div>

          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-800 leading-relaxed">
              당사는 고객의 AI 피부 분석을 위한 내부 연구 목적으로 여러분의 얼굴 사진을 수집·분석합니다.
              <br /><br />
              촬영된 얼굴 사진은 AI 기능을 통해 특징 및 패턴을 분석하는 데 사용되며, 분석 과정에서 수집된 정보는 통계 및 알고리즘 개선에만 활용됩니다.
              <br /><br />
              수집된 개인정보는 연구 목적 달성 후 지체 없이 파기되며, 법령에 따라 보관이 필요한 경우 해당 기간 동안 안전하게 보관됩니다.
              <br /><br />
              해당 정보는 제3자에게 제공되지 않으며, 분석 업무 수행을 위해 필요한 경우에 한해 기술 협력업체에 위탁할 수 있습니다.
              <br /><br />
              개인정보 수집 및 이용에 동의하지 않으실 수 있으나, 동의하지 않을 경우 AI 분석 관련 서비스 참여가 제한될 수 있습니다.
            </p>
          </div>

          <p className="text-center text-xs text-gray-700 mb-4">
            위 사항을 모두 확인했으며, 동의한다면 동의 버튼을 눌러주세요.
          </p>

          <button
            onClick={handleAgree}
            className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white py-3 rounded-lg font-semibold transition-colors mb-2 flex items-center justify-center gap-2"
          >
            동의
            <FiArrowRight className="text-lg" />
          </button>

          <button
            onClick={onClose}
            className="w-full text-xs text-gray-600 underline py-2"
          >
            동의하지 않겠습니다
          </button>
        </div>
      </div>
    </div>
  )
}

