import { useState, useEffect, useRef, useCallback } from "react";
import { Language, TTSHook } from "../types";

export function useTTS(lang: Language): TTSHook {
    const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
    const [speakingId, setSpeakingId] = useState<number | null>(null);
    const [ttsRepeat, setTtsRepeat] = useState<boolean>(false);
    const [ttsRate, setTtsRate] = useState<number>(0.85);
    const [ttsPitch, setTtsPitch] = useState<number>(1.0);
    const [ttsInterval, setTtsInterval] = useState<number>(1200);
    const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

    // ── refs: stale closure 방지 ──────────────────────────────────
    const activeRef = useRef<boolean>(false);   // 현재 재생 중 여부
    const repeatRef = useRef<boolean>(false);
    const rateRef = useRef<number>(0.85);
    const pitchRef = useRef<number>(1.0);
    const intervalRef = useRef<number>(1200);
    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
    const langRef = useRef<Language>(lang);
    const speakingIdRef = useRef<number | null>(null);

    // refs 항상 최신값 동기화
    useEffect(() => { repeatRef.current = ttsRepeat; }, [ttsRepeat]);
    useEffect(() => { rateRef.current = ttsRate; }, [ttsRate]);
    useEffect(() => { pitchRef.current = ttsPitch; }, [ttsPitch]);
    useEffect(() => { intervalRef.current = ttsInterval; }, [ttsInterval]);
    useEffect(() => { voiceRef.current = selectedVoice; }, [selectedVoice]);
    useEffect(() => { langRef.current = lang; }, [lang]);

    // ── 음성 목록 로드 ───────────────────────────────────────────
    useEffect(() => {
        function loadVoices() {
            const voices = window.speechSynthesis?.getVoices() || [];
            setTtsVoices(voices);
        }
        loadVoices();
        window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
        return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
    }, []);

    // ── 언어 변경 시 최적 음성 자동 선택 ───────────────────────
    useEffect(() => {
        if (!ttsVoices.length) return;
        const target = lang.ttsLang;          // e.g. "en-US", "ja-JP"
        const code = lang.code;             // e.g. "en", "ja"
        const exact = ttsVoices.find(v => v.lang === target);
        const base = ttsVoices.find(v => v.lang.startsWith(code));
        const chosen = exact || base || null;
        setSelectedVoice(chosen);
        voiceRef.current = chosen;
    }, [lang, ttsVoices]);

    // ── 정지 ────────────────────────────────────────────────────
    const stopSpeaking = useCallback(() => {
        activeRef.current = false;
        speakingIdRef.current = null;
        window.speechSynthesis?.cancel();
        setSpeakingId(null);
    }, []);

    // ── 핵심: 문장 배열을 순서대로 1개씩 재생 ──────────────────
    const playSentence = useCallback((sentences: string[], msgId: number, idx: number) => {
        // 중단됐거나 다른 메시지 재생 시작됐으면 종료
        if (!activeRef.current || speakingIdRef.current !== msgId) return;
        if (idx >= sentences.length) {
            // 전체 완료
            if (repeatRef.current && speakingIdRef.current === msgId) {
                setTimeout(() => playSentence(sentences, msgId, 0), intervalRef.current * 2);
            } else {
                activeRef.current = false;
                speakingIdRef.current = null;
                setSpeakingId(null);
            }
            return;
        }

        const s = sentences[idx];
        if (!s || !s.trim()) {
            playSentence(sentences, msgId, idx + 1);
            return;
        }

        const utter = new SpeechSynthesisUtterance(s);
        utter.lang = langRef.current.ttsLang;
        utter.rate = rateRef.current;
        utter.pitch = pitchRef.current;

        // 음성 지정 — 현재 언어에 맞는 음성인지 재확인
        const v = voiceRef.current;
        if (v && v.lang.startsWith(langRef.current.code)) {
            utter.voice = v;
        }

        utter.onend = () => {
            if (!activeRef.current || speakingIdRef.current !== msgId) return;
            setTimeout(() => playSentence(sentences, msgId, idx + 1), intervalRef.current);
        };

        utter.onerror = (e) => {
            // "interrupted" 는 cancel()에 의한 정상 중단 — 무시
            if (e.error === "interrupted") return;
            if (!activeRef.current || speakingIdRef.current !== msgId) return;
            setTimeout(() => playSentence(sentences, msgId, idx + 1), intervalRef.current);
        };

        window.speechSynthesis.speak(utter);
    }, []); // 의존성 없음 — 모두 ref로 참조

    // ── speak ────────────────────────────────────────────────────
    const speak = useCallback((text: string, msgId: number, splitSentencesFn: (text: string) => string[]) => {
        if (!window.speechSynthesis) return;

        // 같은 메시지 → 토글 정지
        if (speakingIdRef.current === msgId) {
            stopSpeaking();
            return;
        }

        // 이전 재생 정지
        activeRef.current = false;
        speakingIdRef.current = null;
        window.speechSynthesis.cancel();

        const sentences = splitSentencesFn(text);
        if (!sentences.length) return;

        // 약간 딜레이 후 시작 (cancel() 처리 완료 대기)
        setTimeout(() => {
            activeRef.current = true;
            speakingIdRef.current = msgId;
            setSpeakingId(msgId);
            playSentence(sentences, msgId, 0);
        }, 120);
    }, [stopSpeaking, playSentence]);

    // ── repeatSpeak ──────────────────────────────────────────────
    const repeatSpeak = useCallback((text: string, msgId: number, splitSentencesFn: (text: string) => string[]) => {
        const next = !repeatRef.current;
        setTtsRepeat(next);
        repeatRef.current = next;
        if (speakingIdRef.current !== msgId) {
            speak(text, msgId, splitSentencesFn);
        }
    }, [speak]);

    return {
        ttsEnabled, setTtsEnabled,
        speakingId, setSpeakingId,
        ttsRepeat, setTtsRepeat,
        ttsRate, setTtsRate,
        ttsPitch, setTtsPitch,
        ttsInterval, setTtsInterval,
        ttsVoices,
        selectedVoice, setSelectedVoice,
        stopSpeaking,
        speak,
        repeatSpeak,
    };
}
