"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import CommentList from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";
import {
  loadProcedureReviews,
  loadHospitalReviews,
  loadConcernPosts,
  getCommentCount,
  incrementViewCount,
  getViewCount,
  deleteProcedureReview,
  deleteHospitalReview,
  deleteConcernPost,
  togglePostLike,
  isPostLiked,
  getPostLikeCount,
} from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTimeAgo } from "@/lib/utils/timeFormat";
import { translateText, type LanguageCode, detectLanguage, mapDeepLLangToLanguageCode } from "@/lib/utils/translation";
import { maskNickname } from "@/lib/utils/nicknameMask";
import Image from "next/image";
import { FiHeart, FiMessageCircle, FiEye, FiArrowLeft, FiGlobe, FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import CommunityWriteModal from "@/components/CommunityWriteModal";
import LoginRequiredPopup from "@/components/LoginRequiredPopup";

function PostDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const postId = (params?.id as string) || searchParams.get("id");
  const postType = searchParams.get("type") as
    | "procedure"
    | "hospital"
    | "concern"
    | null;
  const fromTab = searchParams.get("fromTab") as
    | "popular"
    | "latest"
    | "consultation"
    | null;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (postId && postType) {
      loadPostData();
    }
  }, [postId, postType]);

  // 언어 변경 시 번역 상태 초기화
  useEffect(() => {
    setIsTranslated(false);
    setTranslatedTitle(null);
    setTranslatedContent(null);
  }, [language]);

  // PostList에서 좋아요 변경 시 동기화
  useEffect(() => {
    if (!postId || !postType) return;

    const handleLikeUpdate = (event: CustomEvent) => {
      const { postId: updatedPostId, postType: updatedPostType, isLiked: updatedIsLiked, likeCount: updatedLikeCount } = event.detail;
      
      // postType에 따라 post_type 매핑
      const postTypeMap: Record<string, string> = {
        procedure: "treatment_review",
        hospital: "hospital_review",
        concern: "concern_post",
      };
      const mappedPostType = postTypeMap[postType] || postType;
      const mappedUpdatedPostType = updatedPostType || mappedPostType;
      
      // 현재 게시글과 일치하는 경우에만 업데이트
      if (updatedPostId === postId && mappedUpdatedPostType === mappedPostType) {
        setIsLiked(updatedIsLiked);
        setLikeCount(updatedLikeCount);
      }
    };

    window.addEventListener("postLikeUpdated", handleLikeUpdate as EventListener);
    return () => {
      window.removeEventListener("postLikeUpdated", handleLikeUpdate as EventListener);
    };
  }, [postId, postType]);

  const loadPostData = async () => {
    if (!postId || !postType) return;

    setLoading(true);
    try {
      let postData = null;

      if (postType === "procedure") {
        const reviews = await loadProcedureReviews(100);
        postData = reviews.find((r: any) => r.id === postId);
      } else if (postType === "hospital") {
        const reviews = await loadHospitalReviews(100);
        postData = reviews.find((r: any) => r.id === postId);
      } else       if (postType === "concern") {
        const posts = await loadConcernPosts(100);
        const foundPost = posts.find((p: any) => p.id === postId);
        if (foundPost) {
          // concern_category를 category로 매핑, image_paths를 images로 매핑
          postData = {
            ...foundPost,
            category: foundPost.concern_category || "고민글",
            images: foundPost.image_paths || [],
          };
        }
      }

      if (postData) {
        setPost(postData);
        
        // postType에 따라 post_type 매핑
        const postTypeMap: Record<string, string> = {
          procedure: "treatment_review",
          hospital: "hospital_review",
          concern: "concern_post",
        };
        const mappedPostType = postTypeMap[postType] || postType;

        // 좋아요 상태, 댓글 수, 조회수 증가, 조회수를 병렬로 처리
        const [liked, likeCnt, count, views] = await Promise.all([
          isPostLiked(postId, mappedPostType),
          getPostLikeCount(postId, mappedPostType),
          getCommentCount(postId, postType),
          (async () => {
            await incrementViewCount(postId, postType);
            return await getViewCount(postId, postType);
          })(),
        ]);
        setIsLiked(liked);
        setLikeCount(likeCnt);
        setCommentCount(count);
        setViewCount(views);

        // 작성자 확인
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && postData.user_id === user.id) {
          setIsAuthor(true);
        }
      }
    } catch (error) {
      console.error("게시글 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = async () => {
    if (postId && postType) {
      const count = await getCommentCount(postId, postType);
      setCommentCount(count);
    }
  };

  const handleLike = async () => {
    // 로그인 체크
    if (!isLoggedIn) {
      setShowLoginRequiredPopup(true);
      return;
    }

    if (!postId || !postType) return;

    try {
      // postType에 따라 post_type 매핑
      const postTypeMap: Record<string, string> = {
        procedure: "treatment_review",
        hospital: "hospital_review",
        concern: "concern_post",
      };
      const mappedPostType = postTypeMap[postType] || postType;

      const result = await togglePostLike(postId, mappedPostType);
      if (result.success) {
        setIsLiked(result.isLiked);
        const newCount = await getPostLikeCount(postId, mappedPostType);
        setLikeCount(newCount);
        
        // PostList에 좋아요 변경 알림 (커스텀 이벤트)
        window.dispatchEvent(new CustomEvent("postLikeUpdated", {
          detail: {
            postId,
            postType: mappedPostType,
            isLiked: result.isLiked,
            likeCount: newCount,
          },
        }));
      } else {
        if (result.error?.includes("로그인이 필요")) {
          setShowLoginRequiredPopup(true);
        }
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  };

  const handleTranslate = async () => {
    if (!post || isTranslating) return;

    setIsTranslating(true);
    try {
      const targetLang = language as LanguageCode;

      // 원본 텍스트의 언어 감지 (간단한 휴리스틱)
      const contentText = post.content || "";
      const titleText = postType === "concern" && post.title ? post.title : "";
      const detectedSourceLang = detectLanguage(contentText || titleText);

      // 원본 언어와 목표 언어가 같으면 번역 불필요
      if (detectedSourceLang === targetLang) {
        setIsTranslated(false);
        setTranslatedTitle(null);
        setTranslatedContent(null);
        setIsTranslating(false);
        return;
      }

      // 제목과 내용을 번역 (자동 언어 감지 사용)
      const translationPromises: Promise<{ text: string; detectedSourceLang?: string }>[] = [];
      
      if (postType === "concern" && post.title) {
        translationPromises.push(translateText(post.title, targetLang, null));
      } else {
        translationPromises.push(Promise.resolve({ text: "" }));
      }
      
      translationPromises.push(translateText(contentText, targetLang, null));

      const [translatedTitleResult, translatedContentResult] = await Promise.all(translationPromises);

      if (postType === "concern" && post.title) {
        setTranslatedTitle(translatedTitleResult.text);
      }
      setTranslatedContent(translatedContentResult.text);
      setIsTranslated(true);
    } catch (error) {
      console.error("번역 실패:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShowOriginal = () => {
    setIsTranslated(false);
  };

  const handleEdit = () => {
    // 수정 모달을 열기 전에 editData를 설정해야 함
    // CommunityWriteModal이 이미 editData를 받을 수 있도록 수정 필요
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!postId || !postType) return;

    try {
      let result;
      if (postType === "procedure") {
        result = await deleteProcedureReview(postId);
      } else if (postType === "hospital") {
        result = await deleteHospitalReview(postId);
      } else if (postType === "concern") {
        result = await deleteConcernPost(postId);
      } else {
        return;
      }

      if (result.success) {
        alert(t("post.deleted"));
        router.push("/community");
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error: any) {
      console.error("삭제 오류:", error);
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setShowMenu(false);
    }
  };

  const handleEditComplete = () => {
    setShowEditModal(false);
    // 페이지 새로고침하여 수정된 내용 반영
    loadPostData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-500">로딩 중...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-500">{t("post.notFound")}</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const getDisplayName = (): string => {
    // nickname이 있으면 마스킹해서 사용, 없으면 익명
    const nickname = (post as any).nickname;
    if (nickname) {
      return maskNickname(nickname);
    }
    return post.username || post.author_name || "익명";
  };

  const getAvatar = (): string => {
    if (post.avatar_url) return post.avatar_url;
    if (post.avatar) return post.avatar;
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // 카테고리 번역 키 매핑
  const getCategoryTranslationKey = (category: string): string => {
    const categoryMap: Record<string, string> = {
      "피부 고민": "concernCategory.skinConcern",
      "시술 고민": "concernCategory.procedureConcern",
      "병원 선택": "concernCategory.hospitalSelection",
      "가격 문의": "concernCategory.priceInquiry",
      "회복 기간": "concernCategory.recoveryPeriod",
      "부작용": "concernCategory.sideEffect",
      "기타": "concernCategory.other",
    };
    return categoryMap[category] || category;
  };

  const getCategoryDisplayName = (): string => {
    if (!post.category) return "";
    const translationKey = getCategoryTranslationKey(post.category);
    // 번역 키인 경우 번역값 반환, 아닌 경우 원본 반환
    if (translationKey.startsWith("concernCategory.")) {
      return t(translationKey);
    }
    return post.category;
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* 상단 헤더 */}
      <div className="sticky top-[48px] z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // fromTab이 있으면 해당 탭으로 이동, 없으면 뒤로가기
                if (fromTab) {
                  router.push(`/community?tab=${fromTab}`);
                } else {
                  router.back();
                }
              }}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiArrowLeft className="text-gray-700 text-xl" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{t("post.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 번역 버튼 */}
            {post && (() => {
              const contentText = post.content || "";
              const titleText = postType === "concern" && post.title ? post.title : "";
              const detectedSourceLang = detectLanguage(contentText || titleText);
              const targetLang = language as LanguageCode;
              const needsTranslation = detectedSourceLang && detectedSourceLang !== targetLang;
              
              return needsTranslation ? (
                <button
                  onClick={isTranslated ? handleShowOriginal : handleTranslate}
                  disabled={isTranslating}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isTranslated
                      ? "bg-primary-main text-white hover:bg-primary-main/90"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <FiGlobe className="text-base" />
                  <span>{isTranslating ? t("post.translating") : isTranslated ? t("post.showOriginal") : t("post.translate")}</span>
                </button>
              ) : null;
            })()}
            
            {/* 수정/삭제 메뉴 (작성자만) */}
            {isAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <FiMoreVertical className="text-gray-700 text-xl" />
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg"
                      >
                        <FiEdit2 className="text-base" />
                        {t("post.edit")}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg"
                      >
                        <FiTrash2 className="text-base" />
                        {t("post.delete")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 게시글 내용 - sticky 헤더 높이를 고려한 상단 패딩 */}
      <div className="px-4 pt-16 pb-20">
        {/* 카테고리 태그 */}
        <div className="mb-4">
          <span className="inline-flex items-center bg-gradient-to-r from-primary-light/20 to-primary-main/10 text-primary-main px-3 py-1.5 rounded-full text-xs font-semibold border border-primary-main/20">
            {getCategoryDisplayName()}
          </span>
        </div>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-light/30 to-primary-main/20 rounded-full flex items-center justify-center text-2xl shadow-sm ring-2 ring-white">
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt={getDisplayName()}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getAvatar()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 truncate">
                {getDisplayName()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                {post.timestamp || (post.created_at ? formatTimeAgo(post.created_at, t) : "")}
              </span>
              {post.edited && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  수정됨
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 제목 (고민글인 경우) */}
        {postType === "concern" && post.title && (
          <h2 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
            {isTranslated && translatedTitle ? translatedTitle : post.title}
          </h2>
        )}

        {/* 게시글 내용 */}
        <div className="mb-6">
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
            {isTranslated && translatedContent ? translatedContent : post.content}
          </p>
          {isTranslated && (
            <button
              onClick={handleShowOriginal}
              className="mt-2 text-xs text-primary-main hover:text-primary-main/80 underline"
            >
              {t("post.showOriginal")}
            </button>
          )}
        </div>

        {/* 이미지 */}
        {post.images && post.images.length > 0 && (
          <div className="grid gap-2 mb-6 rounded-xl overflow-hidden">
            {post.images.map((img: string, idx: number) => (
              <div
                key={idx}
                className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden aspect-video"
              >
                {img &&
                (img.startsWith("http") ||
                  img.startsWith("blob:") ||
                  img.startsWith("/")) ? (
                  <Image
                    src={img}
                    alt={`게시글 이미지 ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    이미지
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 번역 버튼 - 본문 하단 (이미지 아래) */}
        {(() => {
          const contentText = post.content || "";
          const titleText = postType === "concern" && post.title ? post.title : "";
          const detectedSourceLang = detectLanguage(contentText || titleText);
          const targetLang = language as LanguageCode;
          const needsTranslation = detectedSourceLang && detectedSourceLang !== targetLang;
          
          return needsTranslation ? (
            <div className="mb-6">
              <button
                onClick={isTranslated ? handleShowOriginal : handleTranslate}
                disabled={isTranslating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isTranslated
                    ? "bg-primary-main/10 text-primary-main hover:bg-primary-main/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <FiGlobe className="text-sm" />
                <span>{isTranslating ? t("post.translating") : isTranslated ? t("post.showOriginal") : t("post.translate")}</span>
              </button>
            </div>
          ) : null;
        })()}

        {/* 참여 지표 */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 mb-6">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FiHeart className="text-base" />
            <span className="text-xs font-medium">{likeCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <FiMessageCircle className="text-base" />
            <span className="text-xs font-medium">{commentCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <FiEye className="text-sm" />
            <span className="text-xs">{viewCount.toLocaleString()}</span>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("comment.title")} ({commentCount})
          </h3>
          
          {/* 댓글 작성 폼 */}
          <div className="mb-6">
            <CommentForm
              postId={postId!}
              postType={postType!}
              onSuccess={handleCommentAdded}
            />
          </div>

          {/* 댓글 목록 */}
          <CommentList
            postId={postId!}
            postType={postType!}
            onCommentAdded={handleCommentAdded}
            refreshKey={commentCount}
          />
        </div>
      </div>

      <BottomNavigation />

      {/* 로그인 필요 팝업 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setShowLoginRequiredPopup(false);
          setIsLoggedIn(true);
        }}
      />

      {/* 수정 모달 */}
      {showEditModal && post && postType && (
        <CommunityWriteModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            loadPostData(); // 수정 후 새로고침
          }}
          editData={{
            type: postType as "procedure" | "hospital" | "concern",
            data: post,
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("post.deleteConfirm")}</h3>
            <p className="text-gray-600 mb-6">{t("post.deleteConfirmMessage")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <PostDetailContent />
    </Suspense>
  );
}

