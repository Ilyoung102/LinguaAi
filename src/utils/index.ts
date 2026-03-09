import { Language, ChatMessage, Conversation } from "../types";

export function hexToRgb(hex: string): string {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r},${g},${b}`;
}

export function cleanForTTS(str: string): string {
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

export function filterForTTS(text: string): string[] {
    const lines = text.split("\n");
    const result: string[] = [];

    for (const line of lines) {
        const t = line.trim();
        if (!t) continue;

        // 📢 발음 줄 — 모든 언어에서 제거 (한국어 발음을 TTS로 읽으면 엉망)
        if (t.startsWith("📢")) continue;

        // 💬 한국어 해석 줄 제거
        if (t.startsWith("💬")) continue;
        if (t.startsWith("→")) continue;
        if (t.startsWith("📌")) continue;
        if (t.startsWith("📖")) continue;
        if (t.startsWith("•") || t.startsWith("-")) continue;

        // 한글 비율 40% 초과 줄 제거 (한국어 번역/설명 줄 걸러냄)
        const hangulMatch = t.match(/[가-힯]/g);
        const hangulCount = hangulMatch ? hangulMatch.length : 0;
        const totalLen = t.replace(/\s/g, "").length;
        if (totalLen > 0 && hangulCount / totalLen > 0.4) continue;

        // A: / B: 화자 레이블 제거 후 원문 대사만 추출
        const speakerMatch = t.match(/^[A-Za-z]{1,2}:\s*(.+)$/);
        if (speakerMatch) {
            result.push(cleanForTTS(speakerMatch[1].trim()));
            continue;
        }

        result.push(cleanForTTS(t));
    }

    return result;
}

export function splitSentences(text: string): string[] {
    const filteredLines = filterForTTS(text);
    const filteredText = filteredLines.join(" ");
    if (!filteredText.trim()) return [];

    // 이모지 제거
    const noEmoji = filteredText.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}]/gu, "").trim();

    // 문장 단위 분리: 마침표/느낌표/물음표 (일본어·중국어 포함) 기준
    const sentences = noEmoji
        .replace(/([.!?。！？‼⁉]+)\s*/g, "$1\n")
        .split("\n")
        .map(s => s.trim())
        .filter(s => s.length > 1);

    return sentences.length > 0 ? sentences : [noEmoji.trim()].filter(s => s.length > 1);
}

export function getWelcomeMessage(l: Language): string {
    const msgs: Record<string, string> = {
        en: `Hello! I'm your English tutor. What's your name? 😊`,
        es: `¡Hola! Soy tu tutor de ${l.nativeName}. ¿Cómo te llamas? 😊`,
        fr: `Bonjour! Je suis ton tuteur de ${l.nativeName}. Comment tu t'appelles? 😊`,
        de: `Hallo! Ich bin dein ${l.nativeName}-Tutor. Wie heißt du? 😊`,
        ja: `こんにちは！私はあなたの${l.nativeName}チュー터입니다. お名前は何ですか？😊`,
        it: `Ciao! Sono il tuo tutor di ${l.nativeName}. Come ti chiami? 😊`,
        vi: `Xin chào! Tôi là gia sư ${l.nativeName} của bạn. Tên bạn là gì? 😊`,
        zh: `你好！我是你的${l.nativeName}老师. 你叫什么名字？😊`,
    };
    return msgs[l.code] || `Hello! I'm your ${l.nativeName} tutor. Let's begin! 😊`;
}

export function getPronunciationLabel(langCode: string): string {
    const map: Record<string, string> = {
        en: "발음기호",
        ja: "히라가나 읽기",
        zh: "병음(拼音)",
        vi: "발음(한국어)",
        ko: "발음",
        ar: "발음(로마자)",
    };
    return map[langCode] || "한국어 발음";
}

export function buildScenarioPrompt(sit: any, lang: Language, level: string): string {
    const nativeName = lang.nativeName;
    const lvl = level;
    const pronLabel = getPronunciationLabel(lang.code);

    const dialogueBase = (place: string) => `
${nativeName}로 "${place}" 상황의 실제 대화문을 작성해줘. 학습자 수준: ${lvl}

【필수 규칙】
1. 두 사람(A, B)이 실제로 주고받는 완성된 대화 — 총 10~14 교환
2. 기(시작)→승(전개/문제)→결(해결/마무리) 흐름
3. 모든 대화는 구체적이고 완성된 문장이어야 함
 ❌ 절대 금지: ~をください / ~가欲しい / [음식명] / （商品명） 같은 플레이스홀더
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

B: ホットコーヒー를 하나랑, 치즈케이크를 주세요.
📢 홋토코-히-오 히토츠토、치-즈케-키오 쿠다사이。
💬 따뜻한 커피 한 잔이랑 치즈케이크 주세요.

📌 핵심 표현
ご注文はお決まりですか？
📢 고추몽와 오키마리데스카？
💬 주문은 정하셨나요?
`.trim();

    const wordBase = (_label: string, range: string) => `
${nativeName} ${range} 수준의 핵심 어휘 15개를 선정해줘.

각 어휘마다 3줄 형식으로:
1번줄: 번호. [${nativeName} 단어/표현]
2번줄: 📢 ${pronLabel}: [한국어 발음]
3번줄: 💬 한국어 해석: [뜻] / 예문: [${nativeName} 예문]

마지막에 이 어휘를 활용한 짧은 대화문(A/B, 6줄 이상)을 동일한 3줄 형식으로 작성.
대화문 제목: 📖 어휘 활용 대화
`.trim();

    const map: Record<string, string> = {
        cafe: dialogueBase("카페"),
        travel: dialogueBase("여행 중"),
        hotel: dialogueBase("호텔 체크인/체크아웃"),
        airport: dialogueBase("공항 탑승 수속"),
        shopping: dialogueBase("쇼핑몰/옷가게"),
        restaurant: dialogueBase("레스토랑 주문"),
        street: dialogueBase("길거리에서 길 묻기"),
        phone: dialogueBase("전화 통화"),
        work: dialogueBase("직장 동료와의 대화"),
        hospital: dialogueBase("병원 진료"),
        business: dialogueBase("비즈니스 미팅"),
        general: dialogueBase("일상생활"),
        chit: dialogueBase("친구와의 가벼운 잡담"),
        beginner: wordBase("초급", "A1-A2"),
        intermediate: wordBase("중급", "B1-B2"),
        advanced: wordBase("고급", "C1-C2"),
    };
    return map[sit.id] || dialogueBase(sit.label);
}

export function saveAsJsonFile(messages: ChatMessage[], lang: Language, level: string, mode: string): any {
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
    const filename = `${rawTitle}_${ts}.json`;

    const jsonData = {
        version: "1.0",
        metadata: {
            title: rawTitle,
            lang: lang.code,
            langName: lang.name,
            langNativeName: lang.nativeName,
            langFlag: lang.flag,
            level,
            mode,
            savedAt: now.toISOString(),
            displayTime: now.toLocaleString("ko-KR"),
        },
        messages: messages.map(m => ({
            id: m.id,
            role: m.role,
            text: m.text,
            ts: m.ts,
            isScenario: m.isScenario,
            scenarioColor: m.scenarioColor,
            scenarioIcon: m.scenarioIcon,
        })),
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const encoded = encodeURIComponent(jsonString);
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encoded;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return {
        id: ts,
        title: rawTitle,
        filename,
        langName: lang.name,
        langNativeName: lang.nativeName,
        langCode: lang.code,
        langFlag: lang.flag,
        level,
        mode,
        savedAt: now.toLocaleString("ko-KR"),
        messageCount: messages.filter(m => !m.isScenario).length,
        format: "json",
    };
}

export function saveAsTextFile(messages: ChatMessage[], lang: Language, level: string, mode: string): any {
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
        format: "txt",
    };
}

export function parseConvFile(file: File, content: string, LANGUAGES: Language[]): Conversation | null {
    if (file.name.endsWith(".json")) {
        try {
            const jsonData = JSON.parse(content);
            if (!jsonData.metadata || !jsonData.messages) {
                alert(`⚠️ "${file.name}" — LinguaAI JSON 포맷이 아닙니다.`);
                return null;
            }

            const meta = jsonData.metadata;

            return {
                id: Date.now(),
                title: meta.title,
                filename: file.name,
                langName: meta.langName,
                langCode: meta.lang,
                langNativeName: meta.langNativeName,
                langFlag: meta.langFlag,
                level: meta.level,
                mode: meta.mode,
                createdAt: new Date(meta.savedAt).getTime(),
                messages: jsonData.messages,
                restorable: true,
            };
        } catch (e: any) {
            alert(`⚠️ "${file.name}" — JSON 파싱 오류: ${e.message}`);
            return null;
        }
    }

    if (!content.startsWith("LinguaAI 학습 대화 기록")) {
        alert(`⚠️ "${file.name}" — LinguaAI 포맷이 아닙니다.`);
        return null;
    }

    const lines = content.split("\n");
    const metaLine = lines[1] || "";
    const langMatch = metaLine.match(/언어: (.+?) \(/);
    const levelMatch = metaLine.match(/레벨: (\w+)/);
    const modeMatch = metaLine.match(/모드: (.+?)$/);

    const langName = langMatch?.[1] || "알 수 없음";
    const level = levelMatch?.[1] || "A1";
    const mode = modeMatch?.[1]?.includes("대화") ? "casual" : "structured";
    const rawTitle = file.name.replace(/\.txt$/, "").slice(0, 20);

    return {
        id: Date.now(),
        title: rawTitle,
        filename: file.name,
        langName,
        langFlag: LANGUAGES.find(l => l.name === langName)?.flag || "📄",
        level,
        mode,
        createdAt: Date.now(),
        messages: [],
        restorable: false,
        langCode: LANGUAGES.find(l => l.name === langName)?.code || "en",
    };
}
