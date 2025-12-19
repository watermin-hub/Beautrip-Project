"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { findRecoveryGuideById } from "@/lib/content/recoveryGuidePosts";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiChevronLeft, FiCheck, FiAlertCircle } from "react-icons/fi";
import type { RecoveryGuidePost } from "@/lib/content/recoveryGuidePosts";

// 읽기 좋은 마크다운 렌더링 함수
function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let currentParagraph: (string | JSX.Element)[] = [];
  let listItems: string[] = [];
  let inList = false;
  let currentCardType: "tip" | "warning" | "info" | null = null;
  let cardContent: JSX.Element[] = [];
  let currentWeekCard: JSX.Element[] | null = null; // 주차 섹션 카드 내용
  let weekCardTitle: string | null = null; // 주차 섹션 제목
  let cardCounter = 0; // 고유한 카드 key를 위한 카운터

  // 텍스트를 JSX 요소로 변환 (볼드, 이탤릭 등 처리)
  const parseInline = (
    text: string,
    lineIdx: number
  ): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    // 볼드 텍스트 처리 (**text** 또는 특정 패턴)
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    const matches: Array<{ start: number; end: number; text: string }> = [];

    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
      });
    }

    // 특정 패턴을 자동으로 bold 처리 (推奨回復期間, 対象施術 등)
    const autoBoldPatterns = [
      { pattern: /(推奨回復期間[：:]\s*[^\n]+)/g, label: "推奨回復期間" },
      { pattern: /（対象施術[：:]\s*[^）\n]+）/g, label: "対象施術" },
    ];

    autoBoldPatterns.forEach(({ pattern }) => {
      let patternMatch;
      while ((patternMatch = pattern.exec(text)) !== null) {
        const fullMatch = patternMatch[0];
        const startIdx = patternMatch.index;
        const endIdx = startIdx + fullMatch.length;

        // 이미 처리된 범위와 겹치지 않는지 확인
        const overlaps = matches.some(
          (m) =>
            (startIdx >= m.start && startIdx < m.end) ||
            (endIdx > m.start && endIdx <= m.end) ||
            (m.start >= startIdx && m.end <= endIdx)
        );

        if (!overlaps) {
          matches.push({
            start: startIdx,
            end: endIdx,
            text: fullMatch,
          });
        }
      }
    });

    // matches를 start 순서로 정렬
    matches.sort((a, b) => a.start - b.start);

    matches.forEach((m, idx) => {
      if (m.start > lastIndex) {
        parts.push(text.substring(lastIndex, m.start));
      }
      parts.push(
        <strong
          key={`bold-${lineIdx}-${idx}`}
          className="font-bold text-gray-900"
        >
          {m.text}
        </strong>
      );
      lastIndex = m.end;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphElement = (
        <p
          key={`p-${
            elements.length +
            (cardContent.length || 0) +
            (currentWeekCard?.length || 0)
          }`}
          className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0"
        >
          {currentParagraph.map((item, idx) => (
            <React.Fragment key={idx}>{item}</React.Fragment>
          ))}
        </p>
      );

      if (currentCardType) {
        cardContent.push(paragraphElement);
      } else if (currentWeekCard) {
        currentWeekCard.push(paragraphElement);
      } else {
        elements.push(paragraphElement);
      }

      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const listElement = (
        <ul
          key={`ul-${
            elements.length +
            (cardContent.length || 0) +
            (currentWeekCard?.length || 0)
          }`}
          className="space-y-1.5 pl-6 mb-4 last:mb-0"
        >
          {listItems.map((item, idx) => {
            const cleanItem = item
              .replace(/^[-*]\s+/, "")
              .replace(/^\d+\.\s+/, "");
            const parsed = parseInline(cleanItem, idx);
            return (
              <li
                key={idx}
                className="text-xs text-gray-700 leading-relaxed list-disc"
              >
                {parsed.map((p, pIdx) => (
                  <React.Fragment key={pIdx}>{p}</React.Fragment>
                ))}
              </li>
            );
          })}
        </ul>
      );

      if (currentCardType) {
        cardContent.push(listElement);
      } else if (currentWeekCard) {
        currentWeekCard.push(listElement);
      } else {
        elements.push(listElement);
      }

      listItems = [];
      inList = false;
    }
  };

  let weekCardCounter = 0; // 고유한 주차 카드 key를 위한 카운터
  let lastCardTitle = ""; // 마지막 카드 제목 저장

  const flushWeekCard = () => {
    if (currentWeekCard && weekCardTitle) {
      elements.push(
        <div
          key={`week-card-${weekCardCounter++}`}
          className="border border-gray-200 rounded-xl p-5 bg-white mb-6 mt-10 first:mt-0 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {weekCardTitle}
          </h2>
          <div>{currentWeekCard}</div>
        </div>
      );
      currentWeekCard = null;
      weekCardTitle = null;
    }
  };

  const flushCard = () => {
    if (currentCardType && cardContent.length > 0) {
      const uniqueKey = `card-${cardCounter++}`;
      if (currentCardType === "info") {
        // 의료진 공통 안내 카드
        elements.push(
          <div
            key={uniqueKey}
            className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 mt-6"
          >
            <h3 className="text-base font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span>👨‍⚕️👩‍⚕️</span>
              {content.includes("医師からの共通アドバイス")
                ? "医師からの共通アドバイス"
                : content.includes("医生给所有人的提醒")
                ? "医生给所有人的提醒"
                : "의료진 공통 안내"}
            </h3>
            <div>{cardContent}</div>
          </div>
        );
      } else {
        const isTip = currentCardType === "tip";
        const cardTitle = isTip
          ? lastCardTitle.includes("この週に役立つポイント") ||
            lastCardTitle.includes("✅")
            ? "この週に役立つポイント"
            : "이 주차에 도움 되는 팁"
          : lastCardTitle.includes("この週に避けたいこと") ||
            lastCardTitle.includes("❌")
          ? "この週に避けたいこと"
          : "권고사항";
        const cardElement = (
          <div key={uniqueKey} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              {isTip ? (
                <FiCheck className="text-primary-main text-sm" />
              ) : (
                <FiAlertCircle className="text-orange-500 text-sm" />
              )}
              <h5 className="text-sm font-semibold text-gray-800">
                {cardTitle}
              </h5>
            </div>
            <div className="pl-6">{cardContent}</div>
          </div>
        );

        if (currentWeekCard) {
          currentWeekCard.push(cardElement);
        } else {
          elements.push(cardElement);
        }
      }
      cardContent = [];
      currentCardType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // 카드 시작 감지 (한국어 및 일본어 지원)
    if (
      trimmed.includes("✔ 이 주차에 도움 되는 팁") ||
      trimmed.includes("✔ この週に役立つポイント") ||
      trimmed.includes("**✅ この週に役立つポイント**") ||
      trimmed.includes("✅ この週に役立つポイント")
    ) {
      flushParagraph();
      flushList();
      flushCard();
      lastCardTitle = trimmed;
      currentCardType = "tip";
      return;
    }

    if (
      trimmed.includes("⚠ 권고사항") ||
      trimmed.includes("⚠ 注意事項") ||
      trimmed.includes("**❌ この週に避けたいこと**") ||
      trimmed.includes("❌ この週に避けたいこと")
    ) {
      flushParagraph();
      flushList();
      flushCard();
      lastCardTitle = trimmed;
      currentCardType = "warning";
      return;
    }

    // 헤더 처리
    if (trimmed.startsWith("##")) {
      const level = trimmed.match(/^#+/)?.[0].length || 2;
      const text = trimmed.replace(/^#+\s+/, "");

      // 의료진 공통 안내 섹션인지 먼저 확인 (h3 또는 h4 모두 감지)
      const isMedicalNotice =
        (level === 3 || level === 4) &&
        (text.includes("의료진 공통 안내") ||
          text.includes("医師からの共通アドバイス") ||
          text.includes("医生给所有人的提醒"));

      if (isMedicalNotice) {
        // 의료진 공통 안내 섹션: 주차 카드를 먼저 닫고, 이후 내용은 카드 밖에 표시
        // 먼저 주차 카드 안의 남은 내용들을 flush
        flushParagraph();
        flushList();
        flushCard();
        // 주차 카드를 닫기 (이제 currentWeekCard는 null이 됨)
        flushWeekCard();
        // 주차 카드가 닫혔으므로 currentWeekCard는 null
        // 이후 내용은 카드 밖에 표시되도록 currentCardType = "info" 설정
        currentCardType = "info";
        // h4는 표시하지 않음 (제목은 카드 내부에 표시)
        return;
      }

      // 일반 헤더 처리
      flushParagraph();
      flushList();
      flushCard();

      if (level === 2) {
        // 주차 섹션인지 확인 (🕐, 🕑, 🕒, 🕓 포함)
        const isWeekSection = /[🕐🕑🕒🕓]/.test(text);

        if (isWeekSection) {
          // 주차 섹션 시작 - 이전 주차 카드 닫기
          flushWeekCard();
          // 새 주차 카드 시작
          currentWeekCard = [];
          weekCardTitle = text;
        } else {
          // 시술명 등 일반 h2는 그냥 표시
          flushWeekCard();
          elements.push(
            <h2
              key={`h2-${idx}`}
              className="text-2xl font-bold text-gray-900 mt-10 mb-5 first:mt-0 pb-3 border-b-2 border-gray-200"
            >
              {text}
            </h2>
          );
        }
      } else if (level === 3) {
        const h3Element = (
          <h3
            key={`h3-${idx}`}
            className="text-sm font-semibold text-gray-800 mb-3"
          >
            {text}
          </h3>
        );
        if (currentWeekCard) {
          currentWeekCard.push(h3Element);
        } else {
          elements.push(h3Element);
        }
      } else if (level === 4) {
        elements.push(
          <h4
            key={`h4-${idx}`}
            className="text-lg font-semibold text-gray-900 mt-6 mb-3"
          >
            {text}
          </h4>
        );
      }
      return;
    }

    // 리스트 항목 처리
    if (trimmed.match(/^[-*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
      flushParagraph();
      inList = true;
      listItems.push(trimmed);
      return;
    }

    // 리스트가 끝나면 flush
    if (inList && trimmed === "") {
      flushList();
      return;
    }

    // 빈 줄 처리
    if (trimmed === "") {
      flushParagraph();
      flushList();
      return;
    }

    // 일반 텍스트 처리
    if (inList) {
      flushList();
    }

    const parsed = parseInline(trimmed, idx);
    currentParagraph.push(...parsed);
  });

  flushParagraph();
  flushList();
  flushCard();
  flushWeekCard();

  return <div className="space-y-6">{elements}</div>;
}

interface RecoveryGuidePostDetailPageProps {
  postId: string;
}

export default function RecoveryGuidePostDetailPage({
  postId,
}: RecoveryGuidePostDetailPageProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [post, setPost] = useState<RecoveryGuidePost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // postId가 없으면 실행하지 않음
    if (!postId) {
      setLoading(false);
      setPost(null);
      return;
    }

    const loadPost = async () => {
      setLoading(true);
      try {
        console.log(
          "[RecoveryGuidePostDetailPage] Loading post:",
          postId,
          "language:",
          language
        );
        const loadedPost = await findRecoveryGuideById(postId, language);
        console.log(
          "[RecoveryGuidePostDetailPage] Loaded post:",
          loadedPost ? "Found" : "Not found"
        );
        setPost(loadedPost);
      } catch (error) {
        console.error(
          "[RecoveryGuidePostDetailPage] Failed to load recovery guide:",
          error
        );
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [postId, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-[48px] z-[65] bg-white border-b border-gray-100">
          <div className="flex items-center gap-3 px-4 py-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiChevronLeft className="text-gray-700 text-xl" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">回復ガイド</h1>
          </div>
        </div>
        <div className="px-4 py-8 text-center text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-[48px] z-[101] bg-white border-b border-gray-100">
          <div className="flex items-center gap-3 px-4 py-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiChevronLeft className="text-gray-700 text-xl" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">회복 가이드</h1>
          </div>
        </div>
        <div className="px-4 py-8 text-center text-gray-500 pt-[96px]">
          회복 가이드를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-[48px] z-[50] bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors flex-shrink-0"
          >
            <FiChevronLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 line-clamp-1 flex-1 min-w-0 pr-2">
            {post.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-20 pt-[96px]">
        {/* Badge & Meta */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-primary-light/20 text-primary-main px-3 py-1.5 rounded-full font-medium">
              {post.category}
            </span>
            {post.readTime && (
              <span className="text-sm text-gray-600 font-medium">
                {post.readTime} 읽기
              </span>
            )}
            {post.views !== undefined && (
              <span className="text-sm text-gray-600 font-medium">
                조회 {post.views.toLocaleString()}
              </span>
            )}
          </div>
          {(post.content.includes("(해당 시술:") ||
            post.content.includes("（対象施術：")) && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-800">
                  {post.content.includes("（対象施術：")
                    ? "対象施術："
                    : "해당 시술:"}
                </span>{" "}
                {post.content
                  .match(/\(해당 시술:.*?\)|（対象施術：.*?）/)?.[0]
                  .replace(/^\(해당 시술:\s*|^（対象施術：\s*/, "")
                  .replace(/\)$|）$/, "")}
              </p>
            </div>
          )}
          {(post.content.includes("권장 회복 기간") ||
            post.content.includes("推奨回復期間")) && (
            <div className="mb-4">
              <span className="text-sm text-gray-600 font-medium">
                {post.content
                  .match(
                    /권장 회복 기간\s*:\s*[^\n]+|推奨回復期間[：:]\s*[^\n]+/
                  )?.[0]
                  .replace(/권장 회복 기간\s*:\s*|推奨回復期間[：:]\s*/, "")}
              </span>
            </div>
          )}
        </div>

        {/* Markdown Content */}
        <div className="prose prose-gray max-w-none">
          {renderMarkdown(post.content)}
        </div>
      </div>
    </div>
  );
}
