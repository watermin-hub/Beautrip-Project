"use client";

import { useState, useEffect } from "react";
import { FiX, FiCamera, FiFileText, FiHome, FiUser, FiEdit2, FiArrowLeft } from "react-icons/fi";
import ProcedureReviewForm from "./ProcedureReviewForm";
import HospitalReviewForm from "./HospitalReviewForm";
import ConcernPostForm from "./ConcernPostForm";
import {
  loadMyProcedureReviews,
  loadMyHospitalReviews,
  loadMyConcernPosts,
  ProcedureReviewData,
  HospitalReviewData,
  ConcernPostData,
} from "@/lib/api/beautripApi";
import { supabase } from "@/lib/supabase";
import { formatTimeAgo } from "@/lib/utils/timeFormat";

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
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [myPosts, setMyPosts] = useState<{
    procedures: ProcedureReviewData[];
    hospitals: HospitalReviewData[];
    concerns: ConcernPostData[];
  }>({ procedures: [], hospitals: [], concerns: [] });
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);
  const [editingPost, setEditingPost] = useState<{
    type: "procedure" | "hospital" | "concern";
    data: any;
  } | null>(null);

  // 내 글 로드
  useEffect(() => {
    if (showMyPosts && isOpen) {
      loadMyPosts();
    }
  }, [showMyPosts, isOpen]);

  const loadMyPosts = async () => {
    try {
      setLoadingMyPosts(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        const savedUserId = localStorage.getItem("userId");
        if (!savedUserId) {
          alert("로그인이 필요합니다.");
          setShowMyPosts(false);
          return;
        }
        
        const [procedures, hospitals, concerns] = await Promise.all([
          loadMyProcedureReviews(savedUserId),
          loadMyHospitalReviews(savedUserId),
          loadMyConcernPosts(savedUserId),
        ]);
        
        setMyPosts({ procedures, hospitals, concerns });
        return;
      }

      const [procedures, hospitals, concerns] = await Promise.all([
        loadMyProcedureReviews(user.id),
        loadMyHospitalReviews(user.id),
        loadMyConcernPosts(user.id),
      ]);

      setMyPosts({ procedures, hospitals, concerns });
    } catch (error) {
      console.error("내 글 로드 실패:", error);
      alert("내 글을 불러오는데 실패했습니다.");
    } finally {
      setLoadingMyPosts(false);
    }
  };

  const handleEditPost = (
    type: "procedure" | "hospital" | "concern",
    post: any
  ) => {
    setEditingPost({ type, data: post });
    setShowMyPosts(false);
    setSelectedOption(
      type === "procedure"
        ? "procedure-review"
        : type === "hospital"
        ? "hospital-review"
        : "concern-post"
    );
  };

  if (!isOpen) return null;

  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleBack = () => {
    if (showMyPosts) {
      setShowMyPosts(false);
      setEditingPost(null);
    } else {
      setSelectedOption(null);
      setEditingPost(null);
    }
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
            {showMyPosts ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <FiArrowLeft className="text-gray-600 text-xl" />
                </button>
                <h2 className="text-xl font-bold text-gray-900">내 글 관리</h2>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-gray-900">
                {editingPost ? "글 수정하기" : "글 작성하기"}
              </h2>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiX className="text-gray-600 text-xl" />
            </button>
          </div>
          {!showMyPosts && !editingPost && (
            <p className="text-sm text-gray-500 mt-1">
              어떤 이야기를 공유하고 싶으신가요?
            </p>
          )}
        </div>

        {/* Options or Form */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {showMyPosts ? (
            <div className="space-y-4">
              {loadingMyPosts ? (
                <div className="text-center py-8 text-gray-500">
                  내 글을 불러오는 중...
                </div>
              ) : (
                <>
                  {/* 시술 후기 */}
                  {myPosts.procedures.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        시술 후기 ({myPosts.procedures.length})
                      </h3>
                      <div className="space-y-2">
                        {myPosts.procedures.map((post) => (
                          <div
                            key={post.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {post.content?.substring(0, 50)}
                                {post.content && post.content.length > 50
                                  ? "..."
                                  : ""}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTimeAgo(post.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleEditPost("procedure", post)}
                              className="ml-3 p-2 text-primary-main hover:bg-primary-main/10 rounded-lg transition-colors"
                            >
                              <FiEdit2 className="text-lg" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 병원 후기 */}
                  {myPosts.hospitals.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        병원 후기 ({myPosts.hospitals.length})
                      </h3>
                      <div className="space-y-2">
                        {myPosts.hospitals.map((post) => (
                          <div
                            key={post.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {post.content?.substring(0, 50)}
                                {post.content && post.content.length > 50
                                  ? "..."
                                  : ""}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTimeAgo(post.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleEditPost("hospital", post)}
                              className="ml-3 p-2 text-primary-main hover:bg-primary-main/10 rounded-lg transition-colors"
                            >
                              <FiEdit2 className="text-lg" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 고민글 */}
                  {myPosts.concerns.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        고민글 ({myPosts.concerns.length})
                      </h3>
                      <div className="space-y-2">
                        {myPosts.concerns.map((post) => (
                          <div
                            key={post.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {(post as any).title || post.content?.substring(0, 50)}
                                {!post.title && post.content && post.content.length > 50
                                  ? "..."
                                  : ""}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTimeAgo(post.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleEditPost("concern", post)}
                              className="ml-3 p-2 text-primary-main hover:bg-primary-main/10 rounded-lg transition-colors"
                            >
                              <FiEdit2 className="text-lg" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {myPosts.procedures.length === 0 &&
                    myPosts.hospitals.length === 0 &&
                    myPosts.concerns.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        작성한 글이 없습니다.
                      </div>
                    )}
                </>
              )}
            </div>
          ) : !selectedOption ? (
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
                    setShowMyPosts(true);
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
                  editData={editingPost?.type === "procedure" ? editingPost.data : undefined}
                />
              )}
              {selectedOption === "hospital-review" && (
                <HospitalReviewForm
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  editData={editingPost?.type === "hospital" ? editingPost.data : undefined}
                />
              )}
              {selectedOption === "concern-post" && (
                <ConcernPostForm
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  editData={editingPost?.type === "concern" ? editingPost.data : undefined}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
