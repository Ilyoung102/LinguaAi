# 🌍 LinguaAI - AI 언어 학습 튜터

## 프로젝트 구조

```
lingua-ai-fresh/
├── src/                    # 프론트엔드 소스
│   ├── components/         # React 컴포넌트
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # Context API (Context 상태 관리)
│   ├── types/             # TypeScript 타입 정의
│   ├── utils/             # 유틸리티 함수
│   ├── constants/         # 상수
│   └── App.tsx            # 메인 앱 컴포넌트ด
├── api/                    # 백엔드 API (Express.js)
│   └── index.js           # API 엔드포인트
├── server.js              # 로컬 개발 서버
├── vite.config.ts         # Vite 설정파일
├── tsconfig.json          # TypeScript 설정
├── .env.example           # 환경변수 예제
├── .env.local             # 로컬 개발 환경변수
└── package.json           # 의존성
```

## 주요 기능

- 🤖 **다중 AI 프로바이더**: Claude, ChatGPT, Gemini 지원
- 🗣️ **음성 합성**: Web Speech API 활용한 자동 발음 안내
- 📊 **학습 추적**: 메시지 수, 어휘, 문법 점수 관리
- 🎯 **동적 레벨 조정**: 실력에 따라 자동으로 난이도 조정
- 💾 **대화 저장**: JSON 형식으로 대화 내용 저장 및 복원
- 📱 **반응형 디자인**: 모바일 및 탭렛 지원
- 🌐 **8가지 언어**: 영어, 일본어, 중국어, 스페인어, 프랑스어, 독일어, 이탈리아어, 베트남어

## 기술 스택

### 프론트엔드
- **Framework**: React 18 + TypeScript
- **빌드 도구**: Vite 5
- **상태 관리**: Context API + Custom Hooks
- **스타일**: Inline CSS (Tailwind 미사용)

### 백엔드
- **서버**: Node.js + Express.js
- **보안**: CORS, Rate Limiting (express-rate-limit)
- **환경관리**: dotenv

### AI 서비스
- **Claude** (Anthropic): claude-3-7-sonnet-20250219
- **ChatGPT** (OpenAI): gpt-4o
- **Gemini** (Google): gemini-2.5-flash

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/lingua-ai-fresh
cd lingua-ai-fresh
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 API 키를 입력합니다:
```bash
cp .env.example .env.local
```

`.env.local` 파일 수정:
```ini
# Claude API 키 (https://console.anthropic.com)
CLAUDE_API_KEY=sk-ant-api03-...

# OpenAI API 키 (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Gemini API 키 (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=...

# 서버 설정
PORT=3001
NODE_ENV=development
```

### 4. 개발 서버 실행

**프론트엔드만 실행** (직접 API 호출):
```bash
npm run dev
```

**백엔드 API 서버 실행**:
```bash
npm run dev:api
```

**프론트엔드 + 백엔드 동시 실행**:
```bash
npm run dev:all
```

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3001

### 5. 프로덕션 빌드

```bash
npm run build
```

빌드 결과는 `dist/` 폴더에 생성됩니다.

## API 엔드포인트

### Claude API
```bash
POST http://localhost:3001/api/claude
Content-Type: application/json

{
  "systemPrompt": "You are a helpful assistant...",
  "messages": [{ "role": "user", "content": "..." }],
  "userText": "사용자 입력",
  "maxTokens": 1200
}
```

### OpenAI API
```bash
POST http://localhost:3001/api/openai
```

### Gemini API
```bash
POST http://localhost:3001/api/gemini
```

## 배포 (Vercel)

### 1. Vercel 계정 생성
https://vercel.com에서 가입하세요.

### 2. 프로젝트 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel
```

### 3. 환경변수 설정

Vercel 대시보드에서 환경변수 설정:
- `CLAUDE_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `NODE_ENV=production`

## 개선사항 (Completed)

### ✅ 타스크 1: Context API로 상태 관리 통합
- `LanguageContext`: 언어, 레벨, 모드
- `GoalsContext`: 학습 목표
- `ChatContext`: 메시지, 피드백, 통계
- `UIContext`: UI 상태
- `ConversationContext`: 대화 저장/로드

### ✅ 타스크 2: TypeScript 마이그레이션
- `tsconfig.json` 설정
- 모든 Context를 TypeScript로 작성
- `src/types/` 에 타입 정의 추가
- 빌드 성공: 204.58 kB (gzipped)

### ✅ 타스크 3: 백엔드 프록시 서버 구축
- Express.js 기반 API 서버
- Rate Limiting (15분당 100개 요청)
- CORS 지원
- 로컬/Vercel 배포 지원

## 향후 개선 계획

- [ ] React Query 도입 (API 캐싱)
- [ ] 음성 인식 (Web Speech API)
- [ ] 사용자 인증 (Firebase/Auth0)
- [ ] 메모리 기능 (최신 정보 학습)
- [ ] 대시보드 (통계 시각화)
- [ ] E2E 테스트 (Playwright)
- [ ] 단위 테스트 (Jest + React Testing Library)

## 문제 해결

### "API 키가 설정되지 않았습니다"
→ `.env.local` 파일에 API 키가 올바르게 입력되었는지 확인하세요.

### "백엔드 서버에 연결할 수 없습니다"
→ `npm run dev:api`로 백엔드를 실행하거나, `VITE_USE_BACKEND=false`로 설정하여 직접 API 호출을 사용하세요.

### "CORS 에러"
→ 백엔드 서버가 실행 중인지 확인하고, 프론트엔드의 API URL이 올바른지 확인하세요.

## 라이선스

MIT License

## 기여

Pull Request를 환영합니다. 큰 변경의 경우 먼저 Issue를 열어주세요.
