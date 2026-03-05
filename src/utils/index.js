export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

export function cleanForTTS(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **굵게** → 굵게
    .replace(/\*(.+?)\*/g, "$1")        // *이탤릭* → 이탤릭
    .replace(/`(.+?)`/g, "$1")          // `코드` → 코드
    .replace(/_{1,2}(.+?)_{1,2}/g, "$1") // __밑줄__ → 밑줄
    .replace(/#+\s*/g, "")              // ## 헤더 제거
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // [링크](url) → 링크
    .replace(/[*_`~#>|]/g, "")          // 남은 마크다운 기호 제거
    .replace(/\s+/g, " ")
    .trim();
}

export function filterForTTS(text) {
  const lines = text.split("\n");
  const result = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    // 📢 발음 줄 — 콜론 뒤 발음 텍스트만 추출
    if (t.startsWith("📢")) {
      const colonIdx = t.indexOf(":");
      if (colonIdx !== -1) {
        const pron = t.slice(colonIdx + 1).trim();
        if (pron) result.push(cleanForTTS(pron));
      }
      continue;
    }

    // 💬 한국어 해석 줄 제거
    if (t.startsWith("💬")) continue;
    if (t.startsWith("→")) continue;
    if (t.startsWith("📌")) continue;
    if (t.startsWith("📖")) continue;
    if (t.startsWith("•") || t.startsWith("-")) continue;

    // 한글 비율 50% 초과 줄 제거
    const hangulCount = (t.match(/[가-힯]/g) || []).length;
    const totalLen = t.replace(/\s/g, "").length;
    if (totalLen > 0 && hangulCount / totalLen > 0.5) continue;

    // A: / B: 화자 레이블 제거 후 대사만 추출
    const speakerMatch = t.match(/^[A-Za-z]{1,2}:\s*(.+)$/);
    if (speakerMatch) {
      result.push(cleanForTTS(speakerMatch[1].trim()));
      continue;
    }

    result.push(cleanForTTS(t));
  }

  return result.join(" ");
}

export function splitSentences(text) {
  const cleaned = filterForTTS(text);
  // Split on sentence-ending punctuation
  return cleaned
    .replace(/[ἰ0-ἰ0]/gu, " ")  // strip emoji
    .split(/(?<=[.!?。！？])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 1);
}

export function getWelcomeMessage(l) {
  const msgs = {
    en: `Hello! I'm your English tutor. What's your name? 😊`,
    es: `¡Hola! Soy tu tutor de ${l.nativeName}. ¿Cómo te llamas? 😊`,
    fr: `Bonjour! Je suis ton tuteur de ${l.nativeName}. Comment tu t'appelles? 😊`,
    de: `Hallo! Ich bin dein ${l.nativeName}-Tutor. Wie heißt du? 😊`,
    ja: `こんにちは！私はあなたの${l.nativeName}チューターです。お名前は何ですか？😊`,
    it: `Ciao! Sono il tuo tutor di ${l.nativeName}. Come ti chiami? 😊`,
    vi: `Xin chào! Tôi là gia sư ${l.nativeName} của bạn. Tên bạn là gì? 😊`,
    zh: `你好！我是你的${l.nativeName}老师。你叫什么名字？😊`,
  };
  return msgs[l.code] || `Hello! I'm your ${l.nativeName} tutor. Let's begin! 😊`;
}

// 언어별 발음 표기 방식 레이블
export function getPronunciationLabel(langCode) {
  const map = {
    en: "발음기호",
    ja: "히라가나 읽기",
    zh: "병음(拼音)",
    vi: "발음(한국어)",
    ko: "발음",
    ar: "발음(로마자)",
  };
  return map[langCode] || "한국어 발음";
}

export function buildScenarioPrompt(sit, lang, level) {
  const nativeName = lang.nativeName;
  const lvl = level;
  const pronLabel = getPronunciationLabel(lang.code);

  // 3줄 형식: 원어 / 발음 / 한국어 해석
  const dialogueBase = (place) => `
${nativeName}로 "${place}" 상황의 실제 대화문을 작성해줘. 학습자 수준: ${lvl}

【필수 규칙】
1. 두 사람(A, B)이 실제로 주고받는 완성된 대화 — 총 10~14 교환
2. 기(시작)→승(전개/문제)→결(해결/마무리) 흐름
3. 모든 대화는 구체적이고 완성된 문장이어야 함
 ❌ 절대 금지: ~をください / ~が欲しい / [음식명] / （商品名） 같은 플레이스홀더
 ✅ 반드시: コーヒーをください / このシャツをください 처럼 실제 단어 사용
4. 에피소드 제목을 ${nativeName}로
5. 에피소드 끝에 📌 핵심 표현 4~5개

【출력 형식 — 각 대화줄마다 정확히 3줄】
A: [완성된 ${nativeName} 문장]
📢 [한국어 발음(한글로)]
💬 [자연스러운 한국어 번역]

B: [완성된 ${nativeName} 문장]
📢 [한국어 발음(한글로)]
💬 [자연스러운 한국어 번역]

【출력 예시 — 카페 상황, 일본어】
📖 カフェでのひととき

A: いらっしゃいませ！ご注文はお決まりですか？
📢 이랏샤이마세！고추몽와 오키마리데스카？
💬 어서 오세요! 주문은 정하셨나요?

B: ホットコーヒーをひとつと、チーズケーキをください。
📢 홋토코-히-오 히토츠토、치-즈케-키오 쿠다사이。
💬 따뜻한 커피 한 잔이랑 치즈케이크 주세요.

A: かしこまりました。サイズはいかがなさいますか？
📢 카시코마리마시타。사이즈와 이카가 나사이마스카？
💬 알겠습니다. 사이즈는 어떻게 하시겠어요?

📌 핵심 표현
ご注文はお決まりですか？
📢 고추몽와 오키마리데스카？
💬 주문은 정하셨나요?
`.trim();

  const wordBase = (label, range) => `
${nativeName} ${range} 수준의 핵심 어휘 15개를 선정해줘.

각 어휘마다 3줄 형식으로:
1번줄: 번호. [${nativeName} 단어/표현]
2번줄: 📢 ${pronLabel}: [한국어 발음]
3번줄: 💬 한국어 해석: [뜻] / 예문: [${nativeName} 예문]

마지막에 이 어휘를 활용한 짧은 대화문(A/B, 6줄 이상)을 동일한 3줄 형식으로 작성.
대화문 제목: 📖 어휘 활용 대화
`.trim();

  const map = {
    cafe:         dialogueBase("카페"),
    travel:       dialogueBase("여행 중"),
    hotel:        dialogueBase("호텔 체크인/체크아웃"),
    airport:      dialogueBase("공항 탑승 수속"),
    shopping:     dialogueBase("쇼핑몰/옷가게"),
    restaurant:   dialogueBase("레스토랑 주문"),
    street:       dialogueBase("길거리에서 길 묻기"),
    phone:        dialogueBase("전화 통화"),
    work:         dialogueBase("직장 동료와의 대화"),
    hospital:     dialogueBase("병원 진료"),
    business:     dialogueBase("비즈니스 미팅"),
    general:      dialogueBase("일상생활"),
    chit:         dialogueBase("친구와의 가벼운 잡담"),
    beginner:     wordBase("초급", "A1-A2"),
    intermediate: wordBase("중급", "B1-B2"),
    advanced:     wordBase("고급", "C1-C2"),
  };
  return map[sit.id] || dialogueBase(sit.label);
}

export function saveAsTextFile(messages, lang, level, mode) {
  if (messages.length === 0) return null;

  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  const rawTitle = lastUserMsg ? lastUserMsg.text.replace(/[\n \u200b\u200c\u200d\u200e\u200f\ufeff]+/g, " ").trim().slice(0, 10) : "대화";
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("");
  const filename = `${rawTitle}_${ts}.txt`;

  const header = [
    `LinguaAI 학습 대화 기록`,
    `언어: ${lang.name} (${lang.nativeName}) | 레벨: ${level} | 모드: ${mode === "casual" ? "일상 대화" : "구조화 수업"}`,
    `저장 일시: ${now.toLocaleString("ko-KR")}`,
    "=".repeat(60),
    "",
  ].join("\n");

  const body = messages.map(m => {
    if (m.isScenario) return `[상황 요청] ${m.text}\n`;
    const role = m.role === "user" ? "👤 나" : "🌍 튜터";
    return `${role}\n${m.text}\n`;
  }).join("\n" + "-".repeat(40) + "\n\n");

  const content = header + body;

  const encoded = encodeURIComponent(content);
  const a = document.createElement("a");
  a.href = "data:text/plain;charset=utf-8," + encoded;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  return {
    id: ts,
    title: rawTitle,
    filename,
    langName: lang.name,
    langFlag: lang.flag,
    level,
    savedAt: now.toLocaleString("ko-KR"),
    content,
    messageCount: messages.filter(m => !m.isScenario).length,
  };
}

export function parseConvFile(file, content, LANGUAGES) {
  if (!content.startsWith("LinguaAI 학습 대화 기록")) return null;
  const lines = content.split("\n");
  const metaLine  = lines[1] || "";
  const langMatch  = metaLine.match(/언어: (.+?) \(/);
  const levelMatch = metaLine.match(/레벨: (\w+)/);
  const savedMatch = lines[2]?.match(/저장 일시: (.+)/);
  const langName = langMatch?.[1]  || "알 수 없음";
  const level    = levelMatch?.[1] || "A1";
  const savedAt  = savedMatch?.[1] || file.name;
  const rawTitle = file.name.replace(/\.txt$/, "").slice(0, 20);
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    title: rawTitle,
    filename: file.name,
    langName,
    langFlag: LANGUAGES.find(l => l.name === langName)?.flag || "📄",
    level,
    savedAt,
    content,
    messageCount: (content.match(/👤 나/g) || []).length,
  };
}