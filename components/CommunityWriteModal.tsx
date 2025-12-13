"use client";

import { useState } from "react";
import { FiX, FiCamera, FiFileText, FiHome, FiUser } from "react-icons/fi";
import ProcedureReviewForm from "./ProcedureReviewForm";
import HospitalReviewForm from "./HospitalReviewForm";
import ConcernPostForm from "./ConcernPostForm";

interface CommunityWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const writeOptions = [
  {
    id: "procedure-review",
    icon: FiCamera,
    title: "시술 후기",
    description: "시술 경험을 공유해보세요",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "hospital-review",
    icon: FiHome,
    title: "병원 후기",
    description: "병원 방문 경험을 공유해보세요",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "concern-post",
    icon: FiFileText,
    title: "고민글",
    description: "고민이나 질문을 올려보세요",
    color: "from-purple-500 to-pink-500",
  },
];

export default function CommunityWriteModal({
  isOpen,
  onClose,
}: CommunityWriteModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleBack = () => {
    setSelectedOption(null);
  };

  const handleSubmit = () => {
    // 각 폼에서 이미 성공 메시지를 표시하므로 여기서는 alert 제거
    setSelectedOption(null);
    onClose();
    // 후기 목록 새로고침을 위한 이벤트 발생
    window.dispatchEvent(new CustomEvent("reviewAdded"));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-[100] max-w-md mx-auto shadow-2xl animate-slide-up">
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">글 작성하기</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiX className="text-gray-600 text-xl" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            어떤 이야기를 공유하고 싶으신가요?
          </p>
        </div>

        {/* Options or Form */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {!selectedOption ? (
            <div className="space-y-3">
              {writeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    className="w-full p-4 bg-gradient-to-r rounded-xl border-2 border-gray-100 hover:border-primary-main/30 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`bg-gradient-to-br ${option.color} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="text-white text-xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {option.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {option.description}
                        </p>
                      </div>
                      <div className="text-gray-400 group-hover:text-primary-main transition-colors">
                        →
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* 내 글 관리 */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <button
                  onClick={() => {
                    // TODO: 내 글 관리 페이지로 이동
                    alert("내 글 관리 기능은 추후 구현 예정입니다.");
                    onClose();
                  }}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border-2 border-gray-200 hover:border-primary-main/30 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <FiUser className="text-white text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        내 글 관리
                      </h3>
                      <p className="text-sm text-gray-600">
                        작성한 글을 관리해보세요
                      </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-primary-main transition-colors">
                      →
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedOption === "procedure-review" && (
                <ProcedureReviewForm
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                />
              )}
              {selectedOption === "hospital-review" && (
                <HospitalReviewForm
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                />
              )}
              {selectedOption === "concern-post" && (
                <ConcernPostForm onBack={handleBack} onSubmit={handleSubmit} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
