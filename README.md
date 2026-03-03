# 🌍 LinguaAI

AI 기반 다국어 학습 튜터 (일본어·중국어·스페인어 등 7개 언어)

## 지원 AI
- 🟠 Claude (Anthropic) — 키 없이도 Claude.ai 내장 API로 동작
- 🟢 ChatGPT (OpenAI)
- 🔵 Gemini (Google)

---

## 🚀 배포 방법 (GitHub + Vercel, 무료)

### Step 1. GitHub 저장소 만들기
1. https://github.com/new 접속
2. Repository name: `lingua-ai`
3. Public 선택 → **Create repository**

### Step 2. 코드 올리기 (PC 터미널)
```bash
cd lingua-ai
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/[내유저명]/lingua-ai.git
git push -u origin main
```

### Step 3. Vercel 배포
1. https://vercel.com 접속 → **Sign up with GitHub**
2. **Add New Project** → `lingua-ai` 선택
3. Framework: **Vite** 자동 감지됨
4. **Deploy** 클릭

→ 약 1분 후 `https://lingua-ai-[xxx].vercel.app` URL 발급!

---

## 💻 로컬 실행
```bash
npm install
npm run dev
# → http://localhost:3000
```

## 📦 빌드
```bash
npm run build
# → dist/ 폴더 생성
```

---

## API 키 발급
| AI | URL |
|----|-----|
| Claude | https://console.anthropic.com |
| ChatGPT | https://platform.openai.com/api-keys |
| Gemini | https://aistudio.google.com/apikey |

> ⚠️ API 키는 앱 내 ⚙️ 설정에서 입력. localStorage에 저장되어 새로고침해도 유지됩니다.
