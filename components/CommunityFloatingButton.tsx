"use client";

import { useRouter } from "next/navigation";
import { FiEdit3 } from "react-icons/fi";

export default function CommunityFloatingButton() {
  const router = useRouter();

  return (
    <div className="fixed bottom-20 right-0 left-0 z-40 pointer-events-none max-w-md mx-auto">
      <div className="relative pointer-events-auto">
        {/* 플로팅 버튼 - 우측 하단 고정 */}
        <button
          onClick={() => router.push("/community/write")}
          className="absolute bottom-0 right-4 w-14 h-14 sm:w-16 sm:h-16 bg-primary-main hover:bg-[#2DB8A0] active:bg-primary-light text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
          style={{
            minWidth: "56px",
            minHeight: "56px",
          }}
          aria-label="글 작성하기"
        >
          <FiEdit3 className="text-xl sm:text-2xl" />
        </button>
      </div>
    </div>
  );
}
