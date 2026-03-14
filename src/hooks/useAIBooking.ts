import { useState, useEffect, useRef, useCallback } from 'react';
import { aiBookingAPI } from '@/services/api';
import { useWebSpeechRecognition } from './useWebSpeechRecognition';
import { useWebTTS } from './useWebTTS';

export interface ProductCard {
  _id: string;
  index: number;
  name: string;
  brand: { name: string; logo?: any } | null;
  price: { selling: number; mrp: number };
  thumbnail: { url: string } | null;
  image: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  products?: ProductCard[];
}

export interface CollectedData {
  language: string | null;
  flowType: string | null;
  vehicleType: string | null;
  problem: string | null;
  problemDetails: string | null;
  preferredDate: string | null;
  preferredTimeSlot: string | null;
  paymentMethod: string | null;
  addressConfirmed: boolean;
  newAddress: string | null;
  productQuery: string | null;
  selectedProductId: string | null;
  selectedProductName: string | null;
  selectedProductPrice: number | null;
  quantity: number | null;
}

const INITIAL_COLLECTED_DATA: CollectedData = {
  language: null,
  flowType: null,
  vehicleType: null,
  problem: null,
  problemDetails: null,
  preferredDate: null,
  preferredTimeSlot: null,
  paymentMethod: null,
  addressConfirmed: false,
  newAddress: null,
  productQuery: null,
  selectedProductId: null,
  selectedProductName: null,
  selectedProductPrice: null,
  quantity: null,
};

let msgIdCounter = 0;
const nextId = () => `msg_${++msgIdCounter}_${Date.now()}`;

export function useAIBooking(userName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState('language');
  const [collectedData, setCollectedData] = useState<CollectedData>({
    ...INITIAL_COLLECTED_DATA,
  });
  const [isComplete, setIsComplete] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const isMounted = useRef(true);
  const processingRef = useRef(false);
  const collectedDataRef = useRef<CollectedData>({ ...INITIAL_COLLECTED_DATA });
  const lastAIMessage = useRef<string>('');

  const currentLanguage = useRef<string>('hi-IN');

  // TTS
  const { isSpeaking, speak, stop: stopSpeaking, lastSpeakEndTime } = useWebTTS();

  // STT
  const sttResultRef = useRef<string>('');
  const {
    isListening,
    partialText,
    isSupported: sttSupported,
    startListening: startSTT,
    stopListening: stopSTT,
  } = useWebSpeechRecognition({
    onResult: (text) => {
      sttResultRef.current = text;
    },
  });

  useEffect(() => {
    collectedDataRef.current = collectedData;
  }, [collectedData]);

  useEffect(() => {
    if (!collectedData.language) return;
    currentLanguage.current =
      collectedData.language === 'english' ? 'en-IN' : 'hi-IN';
  }, [collectedData.language]);

  useEffect(() => {
    isMounted.current = true;
    processingRef.current = false;
    return () => {
      isMounted.current = false;
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Echo detection
  const isEcho = useCallback(
    (text: string): boolean => {
      const timeSinceTTS = Date.now() - lastSpeakEndTime.current;
      if (timeSinceTTS > 3000) return false;
      if (!lastAIMessage.current) return false;

      const spoken = lastAIMessage.current
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim();
      const heard = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim();
      if (!heard) return false;

      const heardWords = heard.split(/\s+/);
      const spokenWords = new Set(spoken.split(/\s+/));
      const matchCount = heardWords.filter((w) => spokenWords.has(w)).length;
      if (heardWords.length >= 5 && matchCount / heardWords.length > 0.8)
        return true;
      return false;
    },
    [lastSpeakEndTime]
  );

  const startListening = useCallback(async () => {
    // Cooldown after TTS
    const timeSinceSpeakEnd = Date.now() - lastSpeakEndTime.current;
    if (timeSinceSpeakEnd < 2000) {
      setTimeout(() => {
        if (isMounted.current && !processingRef.current) {
          startSTT(currentLanguage.current);
        }
      }, 2000 - timeSinceSpeakEnd + 100);
      return;
    }

    stopSpeaking();
    sttResultRef.current = '';

    // Check mic permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone permission denied');
      return;
    }

    startSTT(currentLanguage.current);
  }, [lastSpeakEndTime, stopSpeaking, startSTT]);

  const stopListening = useCallback(() => {
    stopSTT();
  }, [stopSTT]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || processingRef.current) return;

      if (isEcho(trimmed)) return;

      processingRef.current = true;
      setIsProcessing(true);
      setError(null);

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      try {
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await aiBookingAPI.chat(apiMessages);
        const data = response.data?.data || response.data;

        if (data?.message) {
          const {
            message: aiMessage,
            step: newStep,
            collectedData: newData,
            isComplete: done,
            isConfirmed: confirmed,
            products,
          } = data;

          const assistantMsg: ChatMessage = {
            id: nextId(),
            role: 'assistant',
            content: aiMessage,
            timestamp: Date.now(),
            products:
              products && products.length > 0 ? products : undefined,
          };

          if (isMounted.current) {
            setMessages((prev) => [...prev, assistantMsg]);
            if (newStep) setStep(newStep);
            if (newData) setCollectedData(newData);
            if (done !== undefined) setIsComplete(done);
            if (confirmed !== undefined) setIsConfirmed(confirmed);
            lastAIMessage.current = aiMessage;

            const lang = newData?.language || collectedDataRef.current.language || 'hindi';
            speak(aiMessage, lang);
          }
        } else {
          if (isMounted.current) {
            setError(data?.message || 'AI response failed');
          }
        }
      } catch (e: any) {
        if (isMounted.current) {
          setError(e.response?.data?.message || e.message || 'Failed to get AI response');
        }
      } finally {
        processingRef.current = false;
        if (isMounted.current) setIsProcessing(false);
      }
    },
    [messages, speak, isEcho]
  );

  const startConversation = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      const apiMessages = [{ role: 'user' as const, content: 'Hello' }];
      const response = await aiBookingAPI.chat(apiMessages);
      const data = response.data?.data || response.data;

      if (data?.message) {
        const {
          message: aiMessage,
          step: newStep,
          collectedData: newData,
        } = data;

        const assistantMsg: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          content: aiMessage,
          timestamp: Date.now(),
        };

        if (isMounted.current) {
          setMessages([assistantMsg]);
          if (newStep) setStep(newStep);
          if (newData) setCollectedData(newData);
          lastAIMessage.current = aiMessage;
          speak(aiMessage, newData?.language || 'hindi');
        }
      }
    } catch (e: any) {
      if (isMounted.current) {
        setError(e.message || 'Failed to start conversation');
      }
    } finally {
      processingRef.current = false;
      if (isMounted.current) setIsProcessing(false);
    }
  }, [speak]);

  const addAssistantMessage = useCallback(
    (content: string) => {
      const msg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      speak(content, collectedDataRef.current.language || 'hindi');
    },
    [speak]
  );

  const reset = useCallback(() => {
    stopSpeaking();
    setMessages([]);
    setIsProcessing(false);
    setError(null);
    setStep('language');
    setCollectedData({ ...INITIAL_COLLECTED_DATA });
    setIsComplete(false);
    setIsConfirmed(false);
    processingRef.current = false;
    currentLanguage.current = 'hi-IN';
    msgIdCounter = 0;
  }, [stopSpeaking]);

  return {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    partialText,
    error,
    step,
    collectedData,
    isComplete,
    isConfirmed,
    sttSupported,
    startConversation,
    sendMessage,
    startListening,
    stopListening,
    stopSpeaking,
    speak,
    reset,
    addAssistantMessage,
  };
}
