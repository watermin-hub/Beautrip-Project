# 📘 카테고리 i18n & Key 기반 구조 정리 (공유용)

## 1. 작업 배경 (왜 이 작업을 했는가)

### 기존 구조의 문제점
- 카테고리를 한글 label(예: 피부 / 스킨부스터)로 조인
- 언어가 바뀌면 조인·필터·랭킹이 깨질 위험 존재
- 프론트에 하드코딩된 카테고리 매핑이 있어 유지보수 어려움

### 해결 방향
→ **"언어와 무관한 Key 기반 조인 + 언어별 Label 표시"** 구조로 전환

---

## 2. 핵심 설계 원칙 (중요)

### ✅ Key vs Label 분리

| 구분 | 의미 | 용도 |
|------|------|------|
| `category_*_key` | 언어 독립 식별자 | 조인 / 필터 / 그룹핑 / 랭킹용 |
| `category_*` | 언어별 표시 텍스트 | UI 표시용 |

### 👉 원칙
- **모든 로직은 key 기준**
- **label은 화면에 보여줄 때만 사용**

---

## 3. 현재 DB 상태 요약 (완료된 것)

### ✅ category_i18n (운영 테이블)
- 카테고리 번역 + key 매핑의 Single Source of Truth
- 구조 예시:
  ```
  lang | category_large_key / category_large
       | category_mid_key   / category_mid
       | category_small_key / category_small
  ```
- KR / EN / JP / CN 전부 포함
- 중복·누락 없음 (검증 완료)

### ⚠️ category_i18n_import
- 임포트용 스테이징이었고 운영에서는 사용하지 않음 (삭제 대상)

### ✅ treatment_master 4종 테이블 정합성 완료

| 테이블 | 상태 |
|--------|------|
| `treatment_master` (KR) | ✅ key 100% |
| `treatment_master_en` | ✅ key 100% |
| `treatment_master_jp` | ✅ key 100% |
| `treatment_master_cn` | ✅ key 100% |

- `category_large_key / mid_key / small_key` NULL 0
- 동일 `treatment_id` 기준으로 언어 간 key 완전 일치
- 인코딩 깨짐/임의 카테고리 모두 정정 완료

---

## 4. 현재 데이터 구조 (프론트 기준)

### Treatment 데이터 예시

```typescript
interface Treatment {
  treatment_id: number;

  // 🔑 로직용 (언어 무관, 고정)
  category_large_key: string;
  category_mid_key: string;
  category_small_key: string;

  // 🏷️ 표시용 (언어별)
  category_large: string;
  category_mid: string;
  category_small: string;

  treatment_name: string;
  rating: number;
  review_count: number;
  main_img_url?: string;
}
```

---

## 5. 프론트엔드에서 해야 할 일 ✅

### ① 카테고리 관련 모든 로직을 key 기준으로 변경
- 탭 필터
- 그룹핑
- 랭킹 분류
- 조건 분기

#### ❌ 하지 말 것
```typescript
if (category_mid === '스킨부스터') ❌
```

#### ✅ 해야 할 것
```typescript
if (category_mid_key === 'skin_booster') ✅
```

### ② 카테고리 label은 표시용으로만 사용
- 언어별 테이블(`treatment_master_en/jp/cn`)의 label 사용하거나
- 필요 시 `category_i18n`을 key로 조인해서 가져오기

### ③ 기존 하드코딩 제거
- `CATEGORY_MAPPING`, 언어별 카테고리 하드코딩 → 제거
- 카테고리 구조는 DB가 단일 진실

### ④ RPC 결과 사용 방식
- RPC는 flat row 반환
- 프론트는:
  - `category_mid_key` 기준으로 그룹화만 수행
  - `category_rank / total_reviews / average_rating / treatment_count`
    → 백엔드에서 제공한 값 그대로 사용 (재계산 X)

---

## 6. 백엔드에서 해야 할 일 ✅

### ① 완료된 작업
- `category_i18n` 구축 및 정합성 검증
- `treatment_master` 4종 key 동기화 완료
- `rpc_mid_category_rankings_v2` → key 기반 집계 반환

### ② 남아 있는 선택 작업 (필수 아님)
- `category_treattime_recovery` 테이블
  - 현재는 label 기반
  - 향후 다국어/조인 안정성 필요 시:
    - `category_mid_key` 컬럼 추가
    - key 기반으로 구조 개선
  - 랭킹/탭/추천과 직접 연관 없으면 지금 당장 안 해도 됨

---

## 7. 프론트 테스트 체크리스트 (중요)

- [ ] 언어 변경 시 동일 시술이 동일 카테고리 탭에 위치하는가?
- [ ] 카테고리 탭 전환이 key 기준으로 동작하는가?
- [ ] label은 언어에 맞게 잘 표시되는가?
- [ ] undefined / NaN 없이 렌더링 되는가?

---

## 8. 한 줄 결론

**카테고리 언어 매핑 & key 기반 구조는 DB 기준으로 완료**  
**이제 프론트에서는 "조인은 key / 표시는 label" 원칙만 지키면 안정적으로 동작한다.**





