import { useState, useEffect, useRef, useCallback } from "react";

export function useTTS(lang) {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speakingId, setSpeakingId] = useState(null);
  const [ttsRepeat, setTtsRepeat] = useState(false);
  const [ttsRate, setTtsRate] = useState(0.85);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [ttsInterval, setTtsInterval] = useState(1200);
  const [ttsVoices, setTtsVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const utteranceRef = useRef(null);
  const repeatRef = useRef(false);
  const currentTextRef = useRef("");
  const currentMsgIdRef = useRef(null);

  // Load available TTS voices
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis?.getVoices() || [];
      setTtsVoices(voices);
    }
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Auto-select best voice when language or voices change
  useEffect(() => {
    if (!ttsVoices.length) return;
    const targetLang = lang.ttsLang;
    // Prefer exact match (e.g. es-ES), then base lang match (es), then any
    const exact = ttsVoices.find(v => v.lang === targetLang);
    const base  = ttsVoices.find(v => v.lang.startsWith(lang.code));
    setSelectedVoice(exact || base || null);
  }, [lang, ttsVoices]);

  // keep repeatRef in sync with ttsRepeat state
  useEffect(() => { repeatRef.current = ttsRepeat; }, [ttsRepeat]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    currentTextRef.current = "";
    currentMsgIdRef.current = null;
  }, []);

  const speakSentences = useCallback((sentences, msgId, idx = 0) => {
    if (!window.speechSynthesis) return;
    if (idx >= sentences.length) {
      // All sentences done — check repeat
      if (repeatRef.current) {
        setTimeout(() => speakSentences(sentences, msgId, 0), ttsInterval * 2);
      } else {
        setSpeakingId(null);
        currentMsgIdRef.current = null;
      }
      return;
    }
    const s = sentences[idx];
    if (!s) { speakSentences(sentences, msgId, idx + 1); return; }

    const utter = new SpeechSynthesisUtterance(s);
    utter.lang  = lang.ttsLang;
    utter.rate  = ttsRate;
    utter.pitch = ttsPitch;
    if (selectedVoice) utter.voice = selectedVoice;
    utter.onend = () => {
      // Wait interval then next sentence
      setTimeout(() => {
        if (currentMsgIdRef.current === msgId) {
          speakSentences(sentences, msgId, idx + 1);
        }
      }, ttsInterval);
    };
    utter.onerror = () => {
      setTimeout(() => {
        if (currentMsgIdRef.current === msgId) {
          speakSentences(sentences, msgId, idx + 1);
        }
      }, ttsInterval);
    };
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [lang, ttsRate, ttsPitch, selectedVoice, ttsInterval]);

  const speak = useCallback((text, msgId, splitSentencesFn) => {
    if (!window.speechSynthesis) return;
    // Toggle stop if same message
    if (speakingId === msgId) { stopSpeaking(); return; }
    stopSpeaking();
    currentTextRef.current = text;
    currentMsgIdRef.current = msgId;
    setSpeakingId(msgId);
    const sentences = splitSentencesFn(text);
    speakSentences(sentences, msgId, 0);
  }, [speakingId, stopSpeaking, speakSentences]);

  const repeatSpeak = useCallback((text, msgId, splitSentencesFn) => {
    // Toggle repeat flag and (re)start
    const next = !ttsRepeat;
    setTtsRepeat(next);
    repeatRef.current = next;
    if (speakingId !== msgId) {
      speak(text, msgId, splitSentencesFn);
    }
  }, [ttsRepeat, speakingId, speak]);

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
    repeatSpeak
  };
}