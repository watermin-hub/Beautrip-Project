# API 파일 위치 안내

기존 API 관련 파일들을 다음 위치에 정리했습니다:

## 파일 구조

```
1205/
├── lib/
│   └── api/
│       └── beautripApi.ts          # API 유틸리티 함수 (Treatment 인터페이스, loadTreatments, getThumbnailUrl)
│
└── components/
    └── ProcedureListPage.tsx       # 시술 목록 페이지 컴포넌트 (API 사용)
```

## 파일 설명

### `lib/api/beautripApi.ts`
- **용도**: Beautrip API 관련 유틸리티 함수 모음
- **주요 내용**:
  - `Treatment` 인터페이스: 시술 데이터 타입 정의
  - `loadTreatments()`: API에서 시술 데이터를 불러오는 함수
  - `getThumbnailUrl()`: 썸네일 이미지 URL을 생성하는 함수
- **사용법**:
  ```typescript
  import { loadTreatments, getThumbnailUrl, Treatment } from "@/lib/api/beautripApi";
  ```

### `components/ProcedureListPage.tsx`
- **용도**: 시술 목록을 표시하는 페이지 컴포넌트
- **기능**:
  - API를 통해 시술 데이터 로드
  - 필터링 (검색, 카테고리, 정렬)
  - 찜하기 기능
  - 문의하기 기능 (AI 채팅, 전화, 메일)

## 기존 파일 대응

원래 있던 파일들과의 대응 관계:

| 원본 파일 | 새 위치/파일 | 설명 |
|----------|------------|------|
| `TreatmentCard.jsx` | `components/ProcedureListPage.tsx` 내부 | 컴포넌트가 인라인으로 구현됨 |
| `TreatmentList.jsx` | `components/ProcedureListPage.tsx` | React 버전으로 재작성 |
| `script02.js` (API 로직) | `lib/api/beautripApi.ts` | TypeScript로 변환하여 유틸리티로 분리 |
| `getThumbnailUrl` 함수 | `lib/api/beautripApi.ts` | 유틸리티 함수로 분리 |

## 사용 예시

```typescript
// 컴포넌트에서 사용
import { loadTreatments, Treatment } from "@/lib/api/beautripApi";

// 데이터 로드
const treatments = await loadTreatments();

// 썸네일 URL 생성
const thumbnailUrl = getThumbnailUrl(treatment);
```

## 참고사항

- API URL은 현재 GitHub의 raw 파일을 사용하고 있습니다.
- NaN 값을 null로 변환하는 로직이 포함되어 있습니다.
- 이미지가 없을 경우 플레이스홀더 이미지를 자동으로 생성합니다.

