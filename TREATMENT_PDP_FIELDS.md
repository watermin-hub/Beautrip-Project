# 시술 PDP 페이지용 treatment_master 테이블 필드 목록

## 📋 현재 사용 중인 필드들

### 기본 정보

1. **treatment_id** (number, PK)

   - 시술 고유 ID
   - 라우팅 및 데이터 조회에 사용

2. **treatment_name** (string)

   - 시술명
   - 페이지 제목, 공유, 일정 추가 등에 사용

3. **main_image_url** (string)
   - 메인 이미지 URL
   - 썸네일 표시용 (`getThumbnailUrl` 함수)

### 카테고리 정보

4. **category_large** (string)

   - 대분류 (예: "리프팅", "피부")
   - 카테고리 태그 표시, 일정 추가에 사용

5. **category_mid** (string)

   - 중분류
   - 카테고리 태그 표시, 회복 기간 정보 조회, 일정 추가에 사용

6. **category_small** (string)
   - 소분류
   - 시술명 아래 표시

### 가격 정보

7. **selling_price** (number)

   - 판매 가격
   - 메인 가격 표시

8. **original_price** (number)

   - 원가
   - 취소선으로 표시 (할인 전 가격)

9. **dis_rate** (number)

   - 할인율 (%)
   - 할인 배지 표시

10. **vat_info** (string)
    - VAT 정보
    - 가격 정보 하단에 표시 (없으면 "VAT 포함" 표시)

### 평점/리뷰

11. **rating** (number)

    - 평점
    - 별점 표시

12. **review_count** (number)
    - 리뷰 개수
    - 리뷰 섹션 표시

### 시술 정보

13. **surgery_time** (number | string)

    - 시술 시간 (분 단위 또는 문자열)
    - "시술 정보" 섹션에 표시
    - `parseProcedureTime` 함수로 파싱

14. **downtime** (number | string)

    - 회복 기간 (일 단위 또는 문자열)
    - "시술 정보" 섹션에 표시
    - `parseRecoveryPeriod` 함수로 파싱
    - 일정 추가 시 사용 (fallback)

15. **treatment_hashtags** (string)
    - 시술 키워드 (쉼표로 구분된 문자열)
    - "시술 키워드" 섹션에 태그로 표시

### 병원 정보

16. **hospital_name** (string)

    - 병원명
    - 병원 정보 섹션, 일정 추가, 문의하기 등에 사용

17. **hospital_phone_safe** (string, optional)

    - 병원 전화번호 (안전한 형식)
    - 문의하기 기능 (전화 문의)에 사용
    - fallback: `hospital_phone`

18. **hospital_phone** (string, optional)
    - 병원 전화번호 (fallback)

### 기타 (현재 사용되지 않지만 언급된 필드)

19. **event_url** (string, optional)

    - 이벤트 URL
    - ⚠️ 현재는 제거됨 (사용자 요청으로 제거)

20. **platform** (string, optional)
    - 플랫폼 정보
    - ⚠️ 현재는 제거됨 (사용자 요청으로 제거)

---

## 🔗 JOIN이 필요한 테이블/뷰

### 1. category_treat_time_recovery (또는 유사한 테이블)

- **category_mid**로 매칭
- 추가 정보:
  - `회복기간_min(일)` / `회복기간_max(일)`
  - `시술시간_min(분)` / `시술시간_max(분)`
  - `권장체류일수(일)`
  - `Trip_friendly_level`
  - `다운타임레벨`
  - 회복 기간별 가이드 텍스트 (`1~3`, `4~7`, `8~14`, `15~21`)

### 2. hospital_master

- **hospital_name**로 매칭
- 추가 정보 (선택사항):
  - `hospital_id` (병원 상세 페이지 이동용)
  - `hospital_address` (병원 주소)

---

## 📝 백엔드 뷰 테이블 생성 시 권장사항

### 뷰 이름: `treatment_detail_view` (또는 유사한 이름)

### 포함해야 할 필드들:

```sql
-- treatment_master 기본 필드
treatment_id
treatment_name
main_image_url
category_large
category_mid
category_small
selling_price
original_price
dis_rate
vat_info
rating
review_count
surgery_time
downtime
treatment_hashtags
hospital_name
hospital_phone_safe
hospital_phone

-- category_treat_time_recovery JOIN
회복기간_min(일) AS recovery_period_min
회복기간_max(일) AS recovery_period_max
시술시간_min(분) AS procedure_time_min
시술시간_max(분) AS procedure_time_max
권장체류일수(일) AS recommended_stay_days
Trip_friendly_level AS trip_friendly_level
다운타임레벨 AS downtime_level
회복_가이드_1_3일 AS recovery_guide_1_3
회복_가이드_4_7일 AS recovery_guide_4_7
회복_가이드_8_14일 AS recovery_guide_8_14
회복_가이드_15_21일 AS recovery_guide_15_21

-- hospital_master JOIN (선택사항)
hospital_id
hospital_address
```

### JOIN 조건:

- `treatment_master.category_mid = category_treat_time_recovery.category_mid` (또는 `중분류`)
- `treatment_master.hospital_name = hospital_master.hospital_name`

---

## ⚠️ 주의사항

1. **treatment_hashtags**는 쉼표로 구분된 문자열이므로, 배열로 변환 가능하도록 처리 필요
2. **surgery_time**과 **downtime**은 숫자 또는 문자열일 수 있으므로 유연한 타입 처리 필요
3. 전화번호는 `hospital_phone_safe`를 우선 사용하고, 없으면 `hospital_phone` 사용
4. 회복 기간 정보는 `category_mid`로 JOIN하되, 없으면 `downtime` 필드를 fallback으로 사용
