import { useState, useRef, useCallback } from 'react';
import { aiBookingAPI } from '@/services/api';

export function useWebTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndRef = useRef<number>(0); // timestamp when speaking ends

  const speak = useCallback(async (text: string, language: string = 'hindi') => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    // Clean text of emojis
    const cleanText = text
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
        ''
      )
      .trim();

    if (!cleanText) return;

    try {
      // Try cloud TTS (Google Neural2 voice)
      const res = await aiBookingAPI.tts(cleanText, language);
      const data = res.data?.data || res.data;

      if (data?.success && data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          onEndRef.current = Date.now();
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          // Fallback to browser TTS
          speakBrowserTTS(cleanText, language);
        };

        await audio.play();
        return;
      }
    } catch {
      // Cloud TTS failed — fallback
    }

    // Fallback: browser native TTS
    speakBrowserTTS(cleanText, language);
  }, []);

  const speakBrowserTTS = useCallback((text: string, language: string) => {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'english' ? 'en-IN' : 'hi-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEndRef.current = Date.now();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    onEndRef.current = Date.now();
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    lastSpeakEndTime: onEndRef,
  };
}
