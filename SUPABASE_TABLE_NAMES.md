# Supabase 테이블 이름 확인

현재 코드에서 사용하는 테이블 이름:

## 📋 테이블 목록

1. **시술 후기**: `procedure_reviews`
   - 저장 함수: `saveProcedureReview()` (line 1365)
   - 로드 함수: `loadProcedureReviews()` (line 1491)

2. **병원 후기**: `hospital_reviews`
   - 저장 함수: `saveHospitalReview()` (line 1406)
   - 로드 함수: `loadHospitalReviews()` (line 1517)

3. **고민글**: `concern_posts`
   - 저장 함수: `saveConcernPost()` (line 1449)
   - 로드 함수: `loadConcernPosts()` (line 1543)

## 🔍 확인 사항

만약 Supabase에서 테이블 이름이 다르다면:
- `lib/api/beautripApi.ts` 파일에서 위 테이블 이름들을 수정하면 됩니다.
- 각 함수의 `.from("테이블명")` 부분을 변경하면 됩니다.

## 📝 현재 동작

- **저장**: 폼 작성 시 `saveProcedureReview`, `saveHospitalReview`, `saveConcernPost` 함수로 Supabase에 저장
- **로드**: `ReviewList` 컴포넌트에서 `loadProcedureReviews`, `loadHospitalReviews`, `loadConcernPosts` 함수로 최신 데이터 가져옴
- **정렬**: `created_at` 기준 최신순으로 정렬

## ⚠️ 문제 해결

만약 데이터가 최신글에 표시되지 않는다면:
1. Supabase 테이블 이름이 위와 일치하는지 확인
2. Supabase RLS (Row Level Security) 정책 확인
3. 브라우저 콘솔에서 에러 메시지 확인

