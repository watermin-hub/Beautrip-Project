"use client";

import { useRouter } from "next/navigation";
import {
  FiCamera,
  FiFileText,
  FiHome,
  FiUser,
  FiArrowLeft,
} from "react-icons/fi";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

const writeOptions = [
  {
    id: "procedure-review",
    icon: FiCamera,
    title: "시술 후기",
    description: "시술 경험을 공유해보세요",
    color: "from-pink-500 to-rose-500",
    path: "/community/write/procedure",
  },
  {
    id: "hospital-review",
    icon: FiHome,
    title: "병원 후기",
    description: "병원 방문 경험을 공유해보세요",
    color: "from-blue-500 to-cyan-500",
    path: "/community/write/hospital",
  },
  {
    id: "concern-post",
    icon: FiFileText,
    title: "고민글",
    description: "고민이나 질문을 올려보세요",
    color: "from-purple-500 to-pink-500",
    path: "/community/write/concern",
  },
];

export default function WritePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* Header */}
      <div className="px-6 py-4 sticky top-[64px] bg-white z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">글 작성하기</h2>
            <p className="text-sm text-gray-500 mt-1">
              어떤 이야기를 공유하고 싶으신가요?
            </p>
          </div>
        </div>
      </div>

      {/* Options - 상단 여백 추가 */}
      <div className="px-6 pt-16 pb-24 space-y-3">
        {writeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => router.push(option.path)}
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
                  <p className="text-sm text-gray-600">{option.description}</p>
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
            onClick={() => router.push("/community/my-posts")}
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

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
