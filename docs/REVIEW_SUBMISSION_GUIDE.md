# 후기 작성 기능 사용 가이드

이 문서는 BeauTrip 프로젝트의 후기 작성 기능을 사용하는 방법을 설명합니다.

## 📋 목차

1. [Supabase 테이블 생성](#supabase-테이블-생성)
2. [데이터 저장 흐름](#데이터-저장-흐름)
3. [각 폼별 사용 방법](#각-폼별-사용-방법)
4. [이미지 업로드 (추후 구현)](#이미지-업로드-추후-구현)
5. [문제 해결](#문제-해결)

---

## Supabase 테이블 생성

### 1단계: Supabase 대시보드 접속

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택

### 2단계: SQL Editor에서 테이블 생성

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭
3. `SUPABASE_TABLES.md` 파일에 있는 SQL 쿼리를 복사하여 붙여넣기
4. **Run** 버튼 클릭하여 실행

**생성되는 테이블:**
- `procedure_reviews` (시술후기)
- `hospital_reviews` (병원후기)
- `concern_posts` (고민글)

### 3단계: 테이블 확인

1. 좌측 메뉴에서 **Table Editor** 클릭
2. 생성된 테이블들이 목록에 표시되는지 확인

---

## 데이터 저장 흐름

### 전체 흐름도

```
사용자 입력 → 폼 검증 → API 함수 호출 → Supabase 저장 → 성공/실패 알림
```

### 코드 구조

```
components/
  ├── ProcedureReviewForm.tsx    # 시술후기 폼
  ├── HospitalReviewForm.tsx      # 병원후기 폼
  └── ConcernPostForm.tsx         # 고민글 폼

lib/api/
  └── beautripApi.ts              # API 함수들
      ├── saveProcedureReview()
      ├── saveHospitalReview()
      └── saveConcernPost()
```

---

## 각 폼별 사용 방법

### 1. 시술후기 (ProcedureReviewForm)

#### 필수 입력 항목
- 시술 카테고리
- 시술명(수술명)
- 비용 (만원)
- 시술 만족도 (1~5)
- 병원 만족도 (1~5)
- 성별 (여/남)
- 연령대 (20대/30대/40대/50대)
- 글 내용 (최소 10자)

#### 선택 입력 항목
- 병원명
- 시술 날짜
- 사진 (최대 4장)

#### 저장되는 데이터 예시

```typescript
{
  user_id: 0,
  category: "눈성형",
  procedure_name: "쌍꺼풀 수술",
  hospital_name: "강남성형외과",
  cost: 150,
  procedure_rating: 5,
  hospital_rating: 4,
  gender: "여",
  age_group: "20대",
  surgery_date: "2024-12-07",
  content: "시술 후기 내용...",
  images: ["url1", "url2"]
}
```

### 2. 병원후기 (HospitalReviewForm)

#### 필수 입력 항목
- 병원명
- 시술 카테고리 (대분류)
- 글 내용 (최소 10자)

#### 선택 입력 항목
- 시술명(수술명)
- 병원 방문일
- 전체적인 시술 만족도 (1~5)
- 병원 만족도 (1~5)
- 통역 여부
- 통역 만족도 (1~5, 통역이 있는 경우)
- 사진 (최대 4장)

#### 저장되는 데이터 예시

```typescript
{
  user_id: 0,
  hospital_name: "강남성형외과",
  category_large: "눈성형",
  procedure_name: "쌍꺼풀 수술",
  visit_date: "2024-12-07",
  overall_satisfaction: 5,
  hospital_kindness: 4,
  has_translation: true,
  translation_satisfaction: 5,
  content: "병원 후기 내용...",
  images: ["url1", "url2"]
}
```

### 3. 고민글 (ConcernPostForm)

#### 필수 입력 항목
- 제목
- 고민 카테고리 (피부 고민, 시술 고민, 병원 선택 등)
- 고민 글 내용 (최소 10자)

#### 저장되는 데이터 예시

```typescript
{
  user_id: 0,
  title: "쌍꺼풀 수술 고민입니다",
  concern_category: "시술 고민",
  content: "고민글 내용..."
}
```

---

## 이미지 업로드 (추후 구현)

현재는 이미지 URL 배열로만 저장하도록 구현되어 있습니다. 실제 이미지 파일을 업로드하려면 다음 단계가 필요합니다:

### 1. Supabase Storage 버킷 생성

1. Supabase 대시보드 > **Storage** 클릭
2. **New bucket** 클릭
3. 버킷명: `review-images`
4. **Public bucket** 체크 (공개 접근 허용)
5. **Create bucket** 클릭

### 2. 이미지 업로드 함수 구현

```typescript
// lib/api/imageUpload.ts (예시)
import { supabase } from "../supabase";

export async function uploadReviewImage(
  file: File,
  reviewId: string,
  imageIndex: number
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${reviewId}/${imageIndex}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from("review-images")
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from("review-images")
    .getPublicUrl(fileName);

  return publicUrl;
}
```

### 3. 폼 컴포넌트 수정

각 폼의 `handleImageUpload` 함수를 수정하여 실제 파일을 업로드하도록 변경해야 합니다.

---

## 문제 해결

### 1. "테이블을 찾을 수 없습니다" 오류

**원인:** Supabase에 테이블이 생성되지 않았습니다.

**해결:**
1. `SUPABASE_TABLES.md`의 SQL 쿼리를 실행했는지 확인
2. Supabase 대시보드 > Table Editor에서 테이블 존재 확인
3. 테이블명이 정확한지 확인 (`procedure_reviews`, `hospital_reviews`, `concern_posts`)

### 2. "권한이 없습니다" 오류

**원인:** Row Level Security (RLS)가 활성화되어 있거나 정책이 설정되지 않았습니다.

**해결:**
1. Supabase 대시보드 > Authentication > Policies 확인
2. RLS를 비활성화하거나, 모든 사용자가 읽기/쓰기 가능하도록 정책 설정
3. `SUPABASE_TABLES.md`의 RLS 설정 섹션 참고

### 3. "데이터 형식이 올바르지 않습니다" 오류

**원인:** 입력 데이터가 테이블 스키마와 맞지 않습니다.

**해결:**
1. 콘솔에서 실제 전송되는 데이터 확인
2. 필수 필드가 모두 입력되었는지 확인
3. 데이터 타입이 올바른지 확인 (예: `cost`는 숫자, `gender`는 '여' 또는 '남')

### 4. 이미지가 저장되지 않음

**원인:** 현재는 이미지 URL만 저장하도록 구현되어 있습니다.

**해결:**
- 실제 이미지 파일을 업로드하려면 [이미지 업로드](#이미지-업로드-추후-구현) 섹션 참고
- 현재는 이미지 URL 배열을 직접 입력해야 합니다 (추후 구현 예정)

---

## 다음 단계

1. ✅ Supabase 테이블 생성
2. ✅ 데이터 저장 API 함수 구현
3. ✅ 폼 컴포넌트에 저장 기능 연결
4. ⏳ 이미지 업로드 기능 구현
5. ⏳ 로그인 기능 구현 후 user_id 연동
6. ⏳ 후기 목록 조회 기능 구현
7. ⏳ 후기 수정/삭제 기능 구현

---

## 참고 문서

- [Supabase 테이블 구조 설계](./SUPABASE_TABLES.md)
- [Supabase 공식 문서](https://supabase.com/docs)

