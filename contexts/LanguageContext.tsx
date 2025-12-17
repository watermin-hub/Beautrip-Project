"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type LanguageCode = "KR" | "EN" | "JP" | "CN";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// 번역 데이터
const translations: Record<LanguageCode, Record<string, string>> = {
  KR: {
    // Header
    "header.search": "검색",
    "header.notifications": "알림",

    // Navigation
    "nav.home": "홈",
    "nav.explore": "탐색",
    "nav.community": "커뮤니티",
    "nav.nearby": "주변",
    "nav.schedule": "내 일정",
    "nav.mypage": "마이페이지",

    // Common
    "common.back": "뒤로",
    "common.close": "닫기",
    "common.confirm": "확인",
    "common.cancel": "취소",
    "common.save": "저장",
    "common.delete": "삭제",

    // Favorites
    "favorites.title": "찜 목록",
    "favorites.subtitle": "찜한 시술 및 병원",
    "favorites.empty": "찜한 항목이 없습니다",
    "favorites.emptyDesc": "시술이나 병원에 하트를 눌러 저장해보세요",

    // Cart
    "cart.title": "장바구니",
    "cart.empty": "장바구니가 비어있습니다",
    "cart.emptyDesc": "시술을 장바구니에 추가해보세요",

    // Travel Schedule
    "travel.title": "여행 일정 입력",
    "travel.period": "여행 기간",
    "travel.region": "여행 지역",
    "travel.category": "시술 카테고리",
    "travel.budget": "추정 예산",
    "travel.search": "일정 기반 시술 추천",

    // Explore
    "explore.title": "탐색",
    "explore.schedule": "여행 일정",
    "explore.ranking": "랭킹",
    "explore.theme": "테마",
    "explore.quote": "견적받기",

    // Community
    "community.title": "커뮤니티",
    "community.categories": "카테고리",
    "community.recommended": "추천글",
    "community.latest": "최신글",
    "community.popular": "인기글",
    "community.review": "후기",
    "community.write": "글쓰기",

    // MyPage
    "mypage.title": "마이페이지",
    "mypage.activity": "활동·저장내역",
    "mypage.reservations": "내 예약·결제 내역",
    "mypage.favorites": "찜 목록",
    "mypage.benefits": "혜택",
    "mypage.reviews": "후기",
    "mypage.notifications": "알림",

    // Banners
    "banner.ai.brand": "AI 피부연구소",
    "banner.ai.headline": "피부연구소 OPEN",
    "banner.ai.subheadline": "내 진짜 얼굴나이는?",
    "banner.ai.description": "셀피만 찍으면 1,000P",
    "banner.ai.title": "AI 피부 분석",
    "banner.ai.desc":
      "첨단 AI가 피부 수분, 탄력, 트러블 등 핵심 지표를 분석해 나만의 피부 타입을 정밀하게 진단합니다.",
    "banner.ai.start": "AI 피부분석 시작",
    "banner.ai.reviews": "유사 후기 보기",
    "banner.kbeauty.brand": "K-Beauty Special",
    "banner.kbeauty.headline": "여름 특가 이벤트!",
    "banner.kbeauty.subheadline": "최대 50% 할인",
    "banner.kbeauty.description": "인기 시술 패키지 특별 할인",
    "banner.premium.brand": "Premium Clinic",
    "banner.premium.headline": "신규 오픈 기념",
    "banner.premium.subheadline": "첫 시술 30% 할인",
    "banner.premium.description": "강남 신규 오픈 클리닉 특별 혜택",
    "banner.summer.brand": "Summer Beauty",
    "banner.summer.headline": "여름 준비 완료!",
    "banner.summer.subheadline": "피부 관리 패키지",
    "banner.summer.description": "시원한 여름을 위한 특별 케어",
    "banner.vip.brand": "VIP Membership",
    "banner.vip.headline": "VIP 멤버십 가입",
    "banner.vip.subheadline": "추가 혜택 받기",
    "banner.vip.description": "멤버십 가입 시 추가 포인트 지급",
    "banner.weekend.brand": "Weekend Special",
    "banner.weekend.headline": "주말 특별 이벤트",
    "banner.weekend.subheadline": "주말 예약 시 할인",
    "banner.weekend.description": "주말 예약 고객 특별 혜택",
    "banner.ranking.title": "실시간 인기 검색어",

    // Home Page
    "home.selectSchedule": "여행 일정을 선택해 주세요.",
    "home.selectScheduleFirst":
      "여행 시작일과 종료일을 먼저 선택하면 카테고리를 고를 수 있어요.",
    "home.reviewButton": "리뷰 쓰고 더 많은 정보 얻기",
    "home.reviewAlert": "리뷰 작성 기능은 추후 구현 예정입니다.",
    "home.category.skin": "피부관리",
    "home.category.scar": "흉터/자국",
    "home.category.slim": "윤곽/리프팅",
    "home.category.nose": "코성형",
    "home.category.eyes": "눈성형",
    "home.category.inject": "보톡스/필러",
    "home.category.body": "체형/지방",
    "home.category.other": "기타",
    "calendar.title": "여행 일정 선택",
    "calendar.startDate": "시작일",
    "calendar.endDate": "종료일",
    "calendar.notSelected": "선택 안 함",
    "calendar.selectCategory": "카테고리 선택",
    "calendar.selectEndDate": "종료일을 선택해주세요",
    "procedure.filter": "필터",
    "procedure.customRecommendations": "여행 일정에 딱 맞는 시술 추천",
    "procedure.travelInfo": "여행 일정 정보",
    "procedure.travelPeriod": "여행 기간",
    "procedure.selectedCategory": "선택 카테고리",
    "procedure.estimatedBudget": "예정 예산",
    "procedure.avgTime": "평균 시술시간",
    "procedure.recoveryPeriod": "회복기간",
    "procedure.procedureTime": "분",
    "procedure.recoveryDays": "일",
    "procedure.matchingHospital": "맞춤 병원정보",
    "procedure.viewHospitalInfo": "병원 상세정보 보기",
    "procedure.loading": "추천 시술을 불러오는 중...",
    "procedure.error": "추천 시술을 불러오는 데 실패했습니다.",
    "procedure.noResults":
      "선택하신 여행 기간과 카테고리에 맞는 시술을 찾을 수 없습니다. 일정을 조정하거나 다른 카테고리를 선택해보세요.",
    "procedure.hospitalRecommendation":
      "입력하신 정보를 기반으로 최적의 병원을 추천해드립니다.",
    "home.hotConcerns": "인기 시술",
    "home.seeMore": "더보기",
    "home.seeLess": "접기",
    "home.trendingReviews": "지금 뜨는 리뷰",
    "home.trendingBeforeAfter": "인기 급상승 비포&애프터 리뷰",
    "home.reviewMore": "후기 더 보러가기",
    "home.more": "더 보기",
    "home.mission": "미션",
    "home.missionViewAll": "전체보기",
    "home.mission.attendance": "출석 체크",
    "home.mission.attendanceDesc": "연속 7일 출석",
    "home.mission.review": "리뷰 작성",
    "home.mission.reviewDesc": "후기 1개 작성",
    "home.mission.invite": "친구 초대",
    "home.mission.inviteDesc": "친구 3명 초대",
    "home.mission.reward": "보상",
    "home.mission.participate": "참여하기",
    "home.mission.points": "포인트",
    "home.mission.coupon": "쿠폰",
    "home.countrySearch": "국가별 인기 검색어",
    "home.country.all": "전체",
    "home.country.korea": "한국",
    "home.country.china": "중국",
    "home.country.japan": "일본",
    "home.country.usa": "미국",
    "home.country.sea": "동남아",
    "calendar.mySchedule": "내 일정",
    "calendar.noSchedule": "예정된 일정이 없습니다",
    "calendar.viewAll": "전체보기",
    "calendar.today": "오늘",
    "calendar.consultation": "상담",
    "calendar.procedure": "시술",
    "dday.title": "D-Day",
    "dday.daysUntil": "시술까지",
    "community.warmCommunity": "함께 만드는 따뜻한 커뮤니티",
    "community.warmCommunityDesc":
      "서로를 존중하고 배려하는 마음으로 소통해요. 여러분의 경험이 누군가에게 큰 도움이 됩니다",
    "community.section.recommended": "추천 게시글",
    "community.section.popular": "최근 인기 게시글",
    "community.section.recovery": "수술 회복 수다",
    "community.section.questions": "수술 질문하기",
    "community.section.skinConcerns": "피부 질환별 고민글",
    "community.section.travel": "여행일정 공유",
    "community.section.recoveryGuide": "회복 가이드",
    "community.item.byCategory": "카테고리별 인기글",
    "community.item.photoReview": "(시술, 수술) 카테고리별 포토 & 후기",
    "community.item.surgeryDone": "수술했어요",
    "community.item.recoveryChat": "수술 회복 수다",
    "community.item.askSurgery": "수술 질문하기",
    "community.item.skinDiseases": "피부 질환별 고민글",
    "community.item.popularItinerary": "시술별 인기 여행일정",
    "community.item.askItinerary": "여행일정 질문하기",
    "community.hospitalInfo": "병원정보 이동",
    "community.storySharing": "여러분의 이야기를 들려주세요",
    "community.storySharingDesc":
      "후기를 공유하면 다른 분들에게 큰 도움이 됩니다",
    "community.photoReviewWrite": "포토 후기 작성",
    "community.writePost": "글 작성하기",
    "community.noItems": "등록된 항목이 없습니다.",
    "community.top20.title": "외국인 여행객을 위한 한국 인기 시술 정보 TOP 20!",
    "community.travelRecommendation.title":
      "내 일정에 딱 맞는 한국 여행지 추천 ✈️",
    "community.travelRecommendation.subtitle": "여행 루트 자동 생성해드려요!",
    "explore.section.ranking": "카테고리별 인기 랭킹",
    "explore.section.rankingDesc": "상위 10개 시술 랭킹",
    "explore.section.recommendation": "맞춤 추천",
    "explore.section.recommendationDesc": "일정과 고민에 맞는 시술 추천",
    "explore.section.procedure": "전체 시술•수술",
    "explore.section.procedureDesc": "다양한 시술을 만나보세요",
    "explore.section.hospital": "전체 병원",
    "explore.section.hospitalDesc": "다양한 병원을 만나보세요",
    "explore.ranking.category": "카테고리별",
    "explore.ranking.kbeauty": "K-beauty",
    "explore.ranking.hospital": "추천 병원",

    // Recovery guide page
    "recovery.headerTitle": "시술별 회복기간과 주의사항",
    "recovery.headerSubtitle":
      "각 시술의 회복 기간과 회복 과정을 상세히 안내합니다.",
    "recovery.selectTitle": "보고 싶은 정보를 선택하세요.",
    "recovery.selectSubtitle":
      "각 카드는 회복 패턴이 비슷한 시술·수술들을 한데 모은 그룹입니다.🍀",
    "recovery.currentGroup": "지금 선택한 그룹",
    "recovery.week.tipsTitle": "✔ 이 주차에 도움 되는 팁",
    "recovery.week.cautionsTitle": "⚠ 권고사항",
  },
  EN: {
    // Header
    "header.search": "Search",
    "header.notifications": "Notifications",

    // Navigation
    "nav.home": "Home",
    "nav.explore": "Explore",
    "nav.community": "Community",
    "nav.nearby": "Nearby",
    "nav.schedule": "Schedule",
    "nav.mypage": "My Page",

    // Common
    "common.back": "Back",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",

    // Favorites
    "favorites.title": "Favorites",
    "favorites.subtitle": "Favorited Procedures and Clinics",
    "favorites.empty": "No favorites yet",
    "favorites.emptyDesc": "Tap the heart icon to save procedures or clinics",

    // Cart
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.emptyDesc": "Add procedures to your cart",

    // Travel Schedule
    "travel.title": "Travel Schedule",
    "travel.period": "Travel Period",
    "travel.region": "Travel Region",
    "travel.category": "Procedure Category",
    "travel.budget": "Estimated Budget",
    "travel.search": "Get Procedure Recommendations",

    // Explore
    "explore.title": "Explore",
    "explore.schedule": "Schedule",
    "explore.ranking": "Ranking",
    "explore.theme": "Theme",
    "explore.quote": "Get Quote",

    // Community
    "community.title": "Community",
    "community.categories": "Categories",
    "community.recommended": "Recommended",
    "community.latest": "Latest",
    "community.popular": "Popular",
    "community.review": "Reviews",
    "community.write": "Write",

    // MyPage
    "mypage.title": "My Page",
    "mypage.activity": "Activity & Saved",
    "mypage.reservations": "Reservations & Payments",
    "mypage.favorites": "Favorites",
    "mypage.benefits": "Benefits",
    "mypage.reviews": "Reviews",
    "mypage.notifications": "Notifications",

    // Banners
    "banner.ai.brand": "AI Skin Lab",
    "banner.ai.headline": "Skin Lab OPEN",
    "banner.ai.subheadline": "What's my real face age?",
    "banner.ai.description": "Get 1,000P just by taking a selfie",
    "banner.ai.title": "AI Skin Analysis",
    "banner.ai.desc":
      "Advanced AI analyzes key indicators such as skin moisture, elasticity, and trouble to precisely diagnose your unique skin type.",
    "banner.ai.start": "Start AI Skin Analysis",
    "banner.ai.reviews": "View Similar Reviews",
    "banner.kbeauty.brand": "K-Beauty Special",
    "banner.kbeauty.headline": "Summer Special Event!",
    "banner.kbeauty.subheadline": "Up to 50% Off",
    "banner.kbeauty.description":
      "Special discount on popular procedure packages",
    "banner.premium.brand": "Premium Clinic",
    "banner.premium.headline": "Grand Opening",
    "banner.premium.subheadline": "30% Off First Procedure",
    "banner.premium.description":
      "Special benefits for new Gangnam clinic opening",
    "banner.summer.brand": "Summer Beauty",
    "banner.summer.headline": "Summer Ready!",
    "banner.summer.subheadline": "Skin Care Package",
    "banner.summer.description": "Special care for a cool summer",
    "banner.vip.brand": "VIP Membership",
    "banner.vip.headline": "Join VIP Membership",
    "banner.vip.subheadline": "Get Additional Benefits",
    "banner.vip.description": "Extra points when you join membership",
    "banner.weekend.brand": "Weekend Special",
    "banner.weekend.headline": "Weekend Special Event",
    "banner.weekend.subheadline": "Discount on Weekend Appointments",
    "banner.weekend.description":
      "Special benefits for weekend appointment customers",
    "banner.ranking.title": "Real-time Popular Searches",

    // Home Page
    "home.selectSchedule": "Please select your travel schedule.",
    "home.selectScheduleFirst":
      "Please select travel start and end dates first to choose a category.",
    "home.reviewButton": "Write a Review & Get More Information",
    "home.reviewAlert": "Review writing feature will be implemented soon.",
    "home.category.skin": "Skin Care",
    "home.category.scar": "Scars/Marks",
    "home.category.slim": "Contouring/Lifting",
    "home.category.nose": "Nose Surgery",
    "home.category.eyes": "Eye Surgery",
    "home.category.inject": "Botox/Filler",
    "home.category.body": "Body/Fat",
    "home.category.other": "Other",
    "calendar.title": "Select Travel Schedule",
    "calendar.startDate": "Start Date",
    "calendar.endDate": "End Date",
    "calendar.notSelected": "Not Selected",
    "calendar.selectCategory": "Select Category",
    "calendar.selectEndDate": "Please select end date",
    "procedure.filter": "Filter",
    "procedure.customRecommendations": "Custom Procedure Recommendations",
    "procedure.travelInfo": "Travel Schedule Information",
    "procedure.travelPeriod": "Travel Period",
    "procedure.selectedCategory": "Selected Category",
    "procedure.estimatedBudget": "Estimated Budget",
    "procedure.avgTime": "Average Procedure Time",
    "procedure.recoveryPeriod": "Recovery Period",
    "procedure.procedureTime": "min",
    "procedure.recoveryDays": "days",
    "procedure.matchingHospital": "Matching Hospital Information",
    "procedure.viewHospitalInfo": "View Hospital Details",
    "procedure.loading": "Loading recommendations...",
    "procedure.error": "Failed to load recommendations.",
    "procedure.noResults":
      "No procedures found matching your travel period and category. Please adjust your schedule or try a different category.",
    "procedure.hospitalRecommendation":
      "We recommend the best hospital based on the information you provided.",
    "home.hotConcerns": "Hot Concerns & Procedure Recommendations",
    "home.seeMore": "See More",
    "home.seeLess": "See Less",
    "home.trendingReviews": "Trending Reviews",
    "home.trendingBeforeAfter": "Trending Before & After Reviews",
    "home.reviewMore": "See More Reviews",
    "home.more": "More",
    "home.mission": "Mission",
    "home.missionViewAll": "View All",
    "home.mission.attendance": "Attendance Check",
    "home.mission.attendanceDesc": "7 consecutive days",
    "home.mission.review": "Write Review",
    "home.mission.reviewDesc": "Write 1 review",
    "home.mission.invite": "Invite Friends",
    "home.mission.inviteDesc": "Invite 3 friends",
    "home.mission.reward": "Reward",
    "home.mission.participate": "Participate",
    "home.mission.points": "points",
    "home.mission.coupon": "coupon",
    "home.countrySearch": "Popular Search Terms by Country",
    "home.country.all": "All",
    "home.country.korea": "Korea",
    "home.country.china": "China",
    "home.country.japan": "Japan",
    "home.country.usa": "USA",
    "home.country.sea": "Southeast Asia",
    "calendar.mySchedule": "My Schedule",
    "calendar.noSchedule": "No scheduled events",
    "calendar.viewAll": "View All",
    "calendar.today": "Today",
    "calendar.consultation": "Consultation",
    "calendar.procedure": "Procedure",
    "dday.title": "D-Day",
    "dday.daysUntil": "days until procedure",
    "community.warmCommunity": "A Warm Community We Make Together",
    "community.warmCommunityDesc":
      "Let's communicate with respect and consideration for each other. Your experience is a great help to others",
    "community.section.recommended": "Recommended Posts",
    "community.section.popular": "Recently Popular Posts",
    "community.section.recovery": "Surgery Recovery Stories",
    "community.section.questions": "Ask About Surgery",
    "community.section.skinConcerns": "Skin Concern Posts by Condition",
    "community.section.travel": "Share Travel Itinerary",
    "community.section.recoveryGuide": "Recovery Guide",
    "community.item.byCategory": "Popular Posts by Category",
    "community.item.photoReview":
      "(Procedure/Surgery) Photo & Reviews by Category",
    "community.item.surgeryDone": "I Had Surgery",
    "community.item.recoveryChat": "Surgery Recovery Stories",
    "community.item.askSurgery": "Ask About Surgery",
    "community.item.skinDiseases": "Skin Concern Posts by Condition",
    "community.item.popularItinerary":
      "Popular Travel Itineraries by Procedure",
    "community.item.askItinerary": "Ask About Travel Itinerary",
    "community.hospitalInfo": "Hospital Info",
    "community.storySharing": "Share Your Story",
    "community.storySharingDesc": "Sharing reviews helps others a lot",
    "community.photoReviewWrite": "Write Photo Review",
    "community.writePost": "Write Post",
    "community.noItems": "No items registered.",
    "community.top20.title":
      "TOP 20 Popular Korean Procedures for Foreign Travelers!",
    "community.travelRecommendation.title":
      "Perfect Korean Travel Spots for Your Schedule ✈️",
    "community.travelRecommendation.subtitle":
      "We'll automatically create your travel route!",
    "explore.section.ranking": "Popular Rankings by Category",
    "explore.section.rankingDesc": "Top 10 Procedure Rankings",
    "explore.section.recommendation": "Custom Recommendations",
    "explore.section.recommendationDesc":
      "Procedures matched to your schedule and concerns",
    "explore.section.procedure": "Procedure List",
    "explore.section.procedureDesc": "Top 10 Popular Procedures",
    "explore.section.hospital": "Hospital List",
    "explore.section.hospitalDesc": "Top 10 Popular Hospitals",
    "explore.ranking.category": "By Category",
    "explore.ranking.kbeauty": "K-beauty",
    "explore.ranking.hospital": "Recommended Hospitals",

    // Recovery guide page
    "recovery.headerTitle": "Recovery Timeline and Precautions by Procedure",
    "recovery.headerSubtitle":
      "A detailed guide to the recovery period and process for each procedure.",
    "recovery.selectTitle": "Choose the information you want to see.",
    "recovery.selectSubtitle":
      "Each card groups together procedures and surgeries with similar recovery patterns.🍀",
    "recovery.currentGroup": "Currently selected group",
    "recovery.week.tipsTitle": "✔ Tips that help in this week",
    "recovery.week.cautionsTitle": "⚠ What to be careful about",
  },
  JP: {
    // Header
    "header.search": "検索",
    "header.notifications": "通知",

    // Navigation
    "nav.home": "ホーム",
    "nav.explore": "探す",
    "nav.community": "コミュニティ",
    "nav.nearby": "近く",
    "nav.schedule": "スケジュール",
    "nav.mypage": "マイページ",

    // Common
    "common.back": "戻る",
    "common.close": "閉じる",
    "common.confirm": "確認",
    "common.cancel": "キャンセル",
    "common.save": "保存",
    "common.delete": "削除",

    // Favorites
    "favorites.title": "お気に入り",
    "favorites.subtitle": "お気に入りの施術とクリニック",
    "favorites.empty": "お気に入りがありません",
    "favorites.emptyDesc":
      "ハートアイコンをタップして施術やクリニックを保存してください",

    // Cart
    "cart.title": "ショッピングカート",
    "cart.empty": "カートが空です",
    "cart.emptyDesc": "施術をカートに追加してください",

    // Travel Schedule
    "travel.title": "旅行スケジュール",
    "travel.period": "旅行期間",
    "travel.region": "旅行地域",
    "travel.category": "施術カテゴリー",
    "travel.budget": "予算",
    "travel.search": "スケジュールに基づく施術推奨",

    // Explore
    "explore.title": "探す",
    "explore.schedule": "スケジュール",
    "explore.ranking": "ランキング",
    "explore.theme": "テーマ",
    "explore.quote": "見積もり",

    // Community
    "community.title": "コミュニティ",
    "community.categories": "カテゴリー",
    "community.recommended": "おすすめ",
    "community.latest": "最新",
    "community.popular": "人気",
    "community.review": "レビュー",
    "community.write": "書く",

    // MyPage
    "mypage.title": "マイページ",
    "mypage.activity": "アクティビティ・保存",
    "mypage.reservations": "予約・支払い履歴",
    "mypage.favorites": "お気に入り",
    "mypage.benefits": "特典",
    "mypage.reviews": "レビュー",
    "mypage.notifications": "通知",

    // Banners
    "banner.ai.brand": "AI肌研究所",
    "banner.ai.headline": "肌研究所OPEN",
    "banner.ai.subheadline": "私の本当の顔年齢は？",
    "banner.ai.description": "セルフィーを撮るだけで1,000P",
    "banner.ai.title": "AI肌分析",
    "banner.ai.desc":
      "最先端AIが肌の水分、弾力、トラブルなどの主要指標を分析し、あなただけの肌タイプを精密に診断します。",
    "banner.ai.start": "AI肌分析開始",
    "banner.ai.reviews": "類似レビューを見る",
    "banner.kbeauty.brand": "K-Beauty Special",
    "banner.kbeauty.headline": "夏の特別イベント！",
    "banner.kbeauty.subheadline": "最大50%オフ",
    "banner.kbeauty.description": "人気施術パッケージ特別割引",
    "banner.premium.brand": "Premium Clinic",
    "banner.premium.headline": "新規オープン記念",
    "banner.premium.subheadline": "初回施術30%オフ",
    "banner.premium.description": "江南新規オープンクリニック特別特典",
    "banner.summer.brand": "Summer Beauty",
    "banner.summer.headline": "夏の準備完了！",
    "banner.summer.subheadline": "スキンケアパッケージ",
    "banner.summer.description": "涼しい夏のための特別ケア",
    "banner.vip.brand": "VIP Membership",
    "banner.vip.headline": "VIPメンバーシップ登録",
    "banner.vip.subheadline": "追加特典を受け取る",
    "banner.vip.description": "メンバーシップ登録時追加ポイント付与",
    "banner.weekend.brand": "Weekend Special",
    "banner.weekend.headline": "週末特別イベント",
    "banner.weekend.subheadline": "週末予約時割引",
    "banner.weekend.description": "週末予約のお客様特別特典",
    "banner.ranking.title": "リアルタイム人気検索語",

    // Home Page
    "home.selectSchedule": "旅行日程を選択してください。",
    "home.selectScheduleFirst":
      "旅行の開始日と終了日を先に選択すると、カテゴリを選択できます。",
    "home.reviewButton": "レビューを書いてより多くの情報を取得",
    "home.reviewAlert": "レビュー作成機能は今後実装予定です。",
    "home.category.skin": "スキンケア",
    "home.category.scar": "傷跡/跡",
    "home.category.slim": "輪郭/リフト",
    "home.category.nose": "鼻整形",
    "home.category.eyes": "目の整形",
    "home.category.inject": "ボトックス/フィラー",
    "home.category.body": "体型/脂肪",
    "home.category.other": "その他",
    "calendar.title": "旅行日程を選択",
    "calendar.startDate": "開始日",
    "calendar.endDate": "終了日",
    "calendar.notSelected": "選択なし",
    "calendar.selectCategory": "カテゴリを選択",
    "calendar.selectEndDate": "終了日を選択してください",
    "procedure.filter": "フィルター",
    "procedure.customRecommendations": "カスタム施術推奨",
    "procedure.travelInfo": "旅行日程情報",
    "procedure.travelPeriod": "旅行期間",
    "procedure.selectedCategory": "選択カテゴリ",
    "procedure.estimatedBudget": "予定予算",
    "procedure.avgTime": "平均施術時間",
    "procedure.recoveryPeriod": "回復期間",
    "procedure.procedureTime": "分",
    "procedure.recoveryDays": "日",
    "procedure.matchingHospital": "マッチング病院情報",
    "procedure.viewHospitalInfo": "病院詳細情報を見る",
    "procedure.loading": "推奨施術を読み込んでいます...",
    "procedure.error": "推奨施術の読み込みに失敗しました。",
    "procedure.noResults":
      "選択した旅行期間とカテゴリに一致する施術が見つかりません。日程を調整するか、別のカテゴリを選択してください。",
    "procedure.hospitalRecommendation":
      "入力された情報に基づいて最適な病院を推奨します。",
    "home.hotConcerns": "人気の悩み & 施術推奨",
    "home.seeMore": "もっと見る",
    "home.seeLess": "折りたたむ",
    "home.trendingReviews": "今話題のレビュー",
    "home.trendingBeforeAfter": "人気急上昇のビフォー&アフターレビュー",
    "home.reviewMore": "レビューをもっと見る",
    "home.more": "もっと見る",
    "home.mission": "ミッション",
    "home.missionViewAll": "すべて見る",
    "home.mission.attendance": "出席チェック",
    "home.mission.attendanceDesc": "連続7日出席",
    "home.mission.review": "レビュー作成",
    "home.mission.reviewDesc": "レビュー1件作成",
    "home.mission.invite": "友達招待",
    "home.mission.inviteDesc": "友達3人招待",
    "home.mission.reward": "報酬",
    "home.mission.participate": "参加する",
    "home.mission.points": "ポイント",
    "home.mission.coupon": "クーポン",
    "home.countrySearch": "国別人気検索語",
    "home.country.all": "すべて",
    "home.country.korea": "韓国",
    "home.country.china": "中国",
    "home.country.japan": "日本",
    "home.country.usa": "米国",
    "home.country.sea": "東南アジア",
    "calendar.mySchedule": "私のスケジュール",
    "calendar.noSchedule": "予定されたスケジュールがありません",
    "calendar.viewAll": "すべて見る",
    "calendar.today": "今日",
    "calendar.consultation": "相談",
    "calendar.procedure": "施術",
    "dday.title": "D-Day",
    "dday.daysUntil": "施術まで",
    "community.warmCommunity": "一緒に作る温かいコミュニティ",
    "community.warmCommunityDesc":
      "お互いを尊重し、思いやりの心でコミュニケーションしましょう。あなたの経験が誰かの大きな助けになります",
    "community.section.recommended": "おすすめの投稿",
    "community.section.popular": "最近人気の投稿",
    "community.section.recovery": "手術回復の話",
    "community.section.questions": "手術について質問",
    "community.section.skinConcerns": "皮膚疾患別の悩みの投稿",
    "community.section.travel": "旅行日程の共有",
    "community.section.recoveryGuide": "回復ガイド",
    "community.item.byCategory": "カテゴリ別人気投稿",
    "community.item.photoReview": "(施術、手術) カテゴリ別フォト & レビュー",
    "community.item.surgeryDone": "手術を受けました",
    "community.item.recoveryChat": "手術回復の話",
    "community.item.askSurgery": "手術について質問",
    "community.item.skinDiseases": "皮膚疾患別の悩みの投稿",
    "community.item.popularItinerary": "施術別人気旅行日程",
    "community.item.askItinerary": "旅行日程について質問",
    "community.hospitalInfo": "病院情報へ",
    "community.storySharing": "あなたの話を聞かせてください",
    "community.storySharingDesc":
      "レビューを共有すると他の方に大きな助けになります",
    "community.photoReviewWrite": "フォトレビュー作成",
    "community.writePost": "投稿作成",
    "community.noItems": "登録された項目がありません。",
    "community.top20.title": "外国人旅行者のための韓国人気施術情報 TOP 20！",
    "community.travelRecommendation.title":
      "あなたのスケジュールにぴったりの韓国旅行地おすすめ ✈️",
    "community.travelRecommendation.subtitle": "旅行ルートを自動生成します！",
    "explore.section.ranking": "カテゴリ別人気ランキング",
    "explore.section.rankingDesc": "上位10の施術ランキング",
    "explore.section.recommendation": "カスタム推奨",
    "explore.section.recommendationDesc": "日程と悩みに合った施術推奨",
    "explore.section.procedure": "施術リスト",
    "explore.section.procedureDesc": "上位10の人気施術",
    "explore.section.hospital": "病院リスト",
    "explore.section.hospitalDesc": "上位10の人気病院",
    "explore.ranking.category": "カテゴリ別",
    "explore.ranking.kbeauty": "K-beauty",
    "explore.ranking.hospital": "おすすめ病院",

    // Recovery guide page
    "recovery.headerTitle": "施術別 回復期間と注意事項",
    "recovery.headerSubtitle":
      "各施術の回復期間と回復プロセスを分かりやすく案内します。",
    "recovery.selectTitle": "見たい情報を選んでください。",
    "recovery.selectSubtitle":
      "各カードは、回復パターンが似ている施術・手術をまとめたグループです。🍀",
    "recovery.currentGroup": "現在選択中のグループ",
    "recovery.week.tipsTitle": "✔ この週に役立つポイント",
    "recovery.week.cautionsTitle": "⚠ 注意してほしいこと",
  },
  CN: {
    // Header
    "header.search": "搜索",
    "header.notifications": "通知",

    // Navigation
    "nav.home": "首页",
    "nav.explore": "探索",
    "nav.community": "社区",
    "nav.nearby": "附近",
    "nav.schedule": "日程",
    "nav.mypage": "我的",

    // Common
    "common.back": "返回",
    "common.close": "关闭",
    "common.confirm": "确认",
    "common.cancel": "取消",
    "common.save": "保存",
    "common.delete": "删除",

    // Favorites
    "favorites.title": "收藏",
    "favorites.subtitle": "收藏的疗程和诊所",
    "favorites.empty": "暂无收藏",
    "favorites.emptyDesc": "点击心形图标保存疗程或诊所",

    // Cart
    "cart.title": "购物车",
    "cart.empty": "购物车为空",
    "cart.emptyDesc": "将疗程添加到购物车",

    // Travel Schedule
    "travel.title": "旅行日程",
    "travel.period": "旅行期间",
    "travel.region": "旅行地区",
    "travel.category": "疗程类别",
    "travel.budget": "预算",
    "travel.search": "基于日程的疗程推荐",

    // Explore
    "explore.title": "探索",
    "explore.schedule": "日程",
    "explore.ranking": "排名",
    "explore.theme": "主题",
    "explore.quote": "获取报价",

    // Community
    "community.title": "社区",
    "community.categories": "分类",
    "community.recommended": "推荐",
    "community.latest": "最新",
    "community.popular": "热门",
    "community.review": "评论",
    "community.write": "写",

    // MyPage
    "mypage.title": "我的",
    "mypage.activity": "活动·保存",
    "mypage.reservations": "预约·支付记录",
    "mypage.favorites": "收藏",
    "mypage.benefits": "优惠",
    "mypage.reviews": "评论",
    "mypage.notifications": "通知",

    // Banners
    "banner.ai.brand": "AI皮肤研究所",
    "banner.ai.headline": "皮肤研究所OPEN",
    "banner.ai.subheadline": "我的真实年龄是？",
    "banner.ai.description": "只需自拍即可获得1,000P",
    "banner.ai.title": "AI皮肤分析",
    "banner.ai.desc":
      "先进AI分析皮肤水分、弹性、问题等关键指标，精确诊断您的专属皮肤类型。",
    "banner.ai.start": "开始AI皮肤分析",
    "banner.ai.reviews": "查看相似评论",
    "banner.kbeauty.brand": "K-Beauty Special",
    "banner.kbeauty.headline": "夏季特价活动！",
    "banner.kbeauty.subheadline": "最高50%折扣",
    "banner.kbeauty.description": "热门疗程套餐特别折扣",
    "banner.premium.brand": "Premium Clinic",
    "banner.premium.headline": "新店开业纪念",
    "banner.premium.subheadline": "首次疗程30%折扣",
    "banner.premium.description": "江南新开业诊所特别优惠",
    "banner.summer.brand": "Summer Beauty",
    "banner.summer.headline": "夏季准备完成！",
    "banner.summer.subheadline": "皮肤护理套餐",
    "banner.summer.description": "清凉夏季特别护理",
    "banner.vip.brand": "VIP Membership",
    "banner.vip.headline": "VIP会员注册",
    "banner.vip.subheadline": "获得额外优惠",
    "banner.vip.description": "注册会员时额外积分",
    "banner.weekend.brand": "Weekend Special",
    "banner.weekend.headline": "周末特别活动",
    "banner.weekend.subheadline": "周末预约折扣",
    "banner.weekend.description": "周末预约客户特别优惠",
    "banner.ranking.title": "实时热门搜索",

    // Home Page
    "home.selectSchedule": "请选择您的旅行日程。",
    "home.selectScheduleFirst": "请先选择旅行开始和结束日期，然后选择类别。",
    "home.reviewButton": "写评论并获得更多信息",
    "home.reviewAlert": "评论撰写功能将在稍后实现。",
    "home.category.skin": "皮肤护理",
    "home.category.scar": "疤痕/痕迹",
    "home.category.slim": "轮廓/提拉",
    "home.category.nose": "鼻部整形",
    "home.category.eyes": "眼部整形",
    "home.category.inject": "肉毒杆菌/填充剂",
    "home.category.body": "体型/脂肪",
    "home.category.other": "其他",
    "calendar.title": "选择旅行日程",
    "calendar.startDate": "开始日期",
    "calendar.endDate": "结束日期",
    "calendar.notSelected": "未选择",
    "calendar.selectCategory": "选择类别",
    "calendar.selectEndDate": "请选择结束日期",
    "procedure.filter": "筛选",
    "procedure.customRecommendations": "定制疗程推荐",
    "procedure.travelInfo": "旅行日程信息",
    "procedure.travelPeriod": "旅行期间",
    "procedure.selectedCategory": "选择的类别",
    "procedure.estimatedBudget": "预计预算",
    "procedure.avgTime": "平均疗程时间",
    "procedure.recoveryPeriod": "恢复期",
    "procedure.procedureTime": "分钟",
    "procedure.recoveryDays": "天",
    "procedure.matchingHospital": "匹配医院信息",
    "procedure.viewHospitalInfo": "查看医院详情",
    "procedure.loading": "正在加载推荐...",
    "procedure.error": "加载推荐失败。",
    "procedure.noResults":
      "找不到与您的旅行期间和类别匹配的疗程。请调整您的日程或尝试其他类别。",
    "procedure.hospitalRecommendation": "我们将根据您提供的信息推荐最佳医院。",
    "home.hotConcerns": "热门关注 & 疗程推荐",
    "home.seeMore": "查看更多",
    "home.seeLess": "收起",
    "home.trendingReviews": "热门评论",
    "home.trendingBeforeAfter": "热门前后对比评论",
    "home.reviewMore": "查看更多评论",
    "home.more": "更多",
    "home.mission": "任务",
    "home.missionViewAll": "查看全部",
    "home.mission.attendance": "签到",
    "home.mission.attendanceDesc": "连续7天签到",
    "home.mission.review": "写评论",
    "home.mission.reviewDesc": "写1条评论",
    "home.mission.invite": "邀请朋友",
    "home.mission.inviteDesc": "邀请3位朋友",
    "home.mission.reward": "奖励",
    "home.mission.participate": "参与",
    "home.mission.points": "积分",
    "home.mission.coupon": "优惠券",
    "home.countrySearch": "各国热门搜索词",
    "home.country.all": "全部",
    "home.country.korea": "韩国",
    "home.country.china": "中国",
    "home.country.japan": "日本",
    "home.country.usa": "美国",
    "home.country.sea": "东南亚",
    "calendar.mySchedule": "我的日程",
    "calendar.noSchedule": "没有预定日程",
    "calendar.viewAll": "查看全部",
    "calendar.today": "今天",
    "calendar.consultation": "咨询",
    "calendar.procedure": "疗程",
    "dday.title": "D-Day",
    "dday.daysUntil": "距离疗程",
    "community.warmCommunity": "共同创造的温暖社区",
    "community.warmCommunityDesc":
      "让我们以相互尊重和关怀的心沟通。您的经验对他人有很大帮助",
    "community.section.recommended": "推荐帖子",
    "community.section.popular": "最近热门帖子",
    "community.section.recovery": "手术恢复故事",
    "community.section.questions": "手术咨询",
    "community.section.skinConcerns": "按皮肤问题的困扰帖子",
    "community.section.travel": "分享旅行日程",
    "community.section.recoveryGuide": "恢复指南",
    "community.item.byCategory": "按类别热门帖子",
    "community.item.photoReview": "(疗程/手术) 按类别照片和评论",
    "community.item.surgeryDone": "我做了手术",
    "community.item.recoveryChat": "手术恢复故事",
    "community.item.askSurgery": "手术咨询",
    "community.item.skinDiseases": "按皮肤问题的困扰帖子",
    "community.item.popularItinerary": "按疗程热门旅行日程",
    "community.item.askItinerary": "旅行日程咨询",
    "community.hospitalInfo": "医院信息",
    "community.storySharing": "分享您的故事",
    "community.storySharingDesc": "分享评论对他人有很大帮助",
    "community.photoReviewWrite": "写照片评论",
    "community.writePost": "写帖子",
    "community.noItems": "没有注册的项目。",
    "community.top20.title": "外国游客的韩国热门疗程信息 TOP 20！",
    "community.travelRecommendation.title": "适合您日程的韩国旅游地推荐 ✈️",
    "community.travelRecommendation.subtitle": "自动为您生成旅行路线！",
    "explore.section.ranking": "按类别热门排名",
    "explore.section.rankingDesc": "前10个疗程排名",
    "explore.section.recommendation": "定制推荐",
    "explore.section.recommendationDesc": "匹配您日程和关注的疗程推荐",
    "explore.section.procedure": "疗程列表",
    "explore.section.procedureDesc": "前10个热门疗程",
    "explore.section.hospital": "医院列表",
    "explore.section.hospitalDesc": "前10个热门医院",
    "explore.ranking.category": "按类别",
    "explore.ranking.kbeauty": "K-beauty",
    "explore.ranking.hospital": "推荐医院",

    // Recovery guide page
    "recovery.headerTitle": "各疗程的恢复期与注意事项",
    "recovery.headerSubtitle": "为每一种疗程提供详细的恢复时间与恢复过程指引。",
    "recovery.selectTitle": "请选择想看的信息。",
    "recovery.selectSubtitle": "每张卡片汇集了恢复模式相似的手术和疗程。🍀",
    "recovery.currentGroup": "当前选择的分组",
    "recovery.week.tipsTitle": "✔ 本周有帮助的小贴士",
    "recovery.week.cautionsTitle": "⚠ 需要注意的事项",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 초기값은 항상 "KR"로 설정하여 서버/클라이언트 일치 보장
  const [language, setLanguageState] = useState<LanguageCode>("KR");
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트에서만 localStorage 읽기
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as LanguageCode;
      if (
        saved &&
        (saved === "KR" || saved === "EN" || saved === "JP" || saved === "CN")
      ) {
        setLanguageState(saved);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem("language", language);
      // 언어 변경 이벤트 발생
      window.dispatchEvent(
        new CustomEvent("languageChanged", { detail: language })
      );
    }
  }, [language, isMounted]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
