# 사용되지 않는 컴포넌트 분석

## 분석 방법
1. 모든 app/*/page.tsx 파일에서 import하는 컴포넌트 확인
2. 각 컴포넌트 파일에서 import하는 다른 컴포넌트 확인
3. 실제로 사용되지 않는 컴포넌트 식별

## 실제 사용되는 컴포넌트 (app 라우트에서 직접 사용)

### app/page.tsx
- HomePage

### app/explore/page.tsx
- ExplorePage → ExploreScrollPage

### app/community/page.tsx
- CommunityPage

### app/mypage/page.tsx
- MyPage

### app/schedule/page.tsx
- MySchedulePage

### app/nearby/page.tsx
- NearbyPage

### app/favorites/page.tsx
- FavoritesPage
- Header
- BottomNavigation

### app/treatment/[id]/page.tsx
- TreatmentDetailPage

### app/community/posts/page.tsx
- Header
- BottomNavigation
- PostList
- ReviewList

### app/community/photo-review/page.tsx
- Header
- BottomNavigation
- CategoryPhotoReviewPage

## 컴포넌트 의존성 체인 분석 필요

각 컴포넌트가 어떤 다른 컴포넌트를 import하는지 확인해야 합니다.

