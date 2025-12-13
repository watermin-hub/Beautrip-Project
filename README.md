# BeauTrip

뷰티 여행을 위한 Next.js 기반 웹 애플리케이션

## 시작하기

### 1. 환경 변수 설정

프로젝트를 처음 클론한 경우, 환경 변수 파일을 생성해야 합니다.

1. 프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하세요.
2. `.env.example` 파일을 참고하여 필요한 환경 변수를 입력하세요.

```bash
# .env.local 파일 예시
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Supabase 설정 값 확인 방법:**

- Supabase 대시보드 > Settings > API
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> ⚠️ **중요**: `.env.local` 파일은 git에 커밋되지 않습니다. 각 팀원이 개별적으로 생성해야 합니다.

### 2. 설치 (git clone 후 최초 1회 진행했으면 다시 X)

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 문제 해결

### Git Pull 오류: "Your local changes to the following files would be overwritten by merge"

`package-lock.json` 파일에 로컬 변경사항이 있어 pull이 실패하는 경우:

**해결 방법 1: 변경사항 임시 저장 후 Pull (권장)**

```bash
# 변경사항을 임시 저장
git stash

# Pull 실행
git pull origin main

# 필요시 저장했던 변경사항 다시 적용
git stash pop
```

**해결 방법 2: 변경사항 버리고 Pull**

```bash
# package-lock.json의 로컬 변경사항 버리기
git checkout -- package-lock.json

# Pull 실행
git pull origin main

# 의존성 재설치 (package-lock.json이 업데이트되었을 수 있음)
npm install
```

> 💡 **참고**: `package-lock.json`은 자동 생성되는 파일이므로, 일반적으로 로컬 변경사항을 버려도 문제없습니다. 다만 `npm install`을 실행하면 자동으로 최신 버전으로 업데이트됩니다.

## 주요 기능

- 🏠 홈 화면
- 🔍 검색 기능
- 📍 지역 선택
- 🏷️ 필터 태그
- 📱 반응형 디자인
- 🎨 민트톤 디자인 시스템

## 기술 스택

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Icons

## 색상 팔레트

- Primary Light: `#37EAD0`
- Primary Main: `#3ED4BE`
- Background: `#FFFFFF`
