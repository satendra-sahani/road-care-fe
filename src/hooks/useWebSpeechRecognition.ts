import { useState, useRef, useCallback } from 'react';

interface WebSpeechRecognitionOptions {
  onResult?: (text: string) => void;
  onPartialResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useWebSpeechRecognition(options: WebSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [partialText, setPartialText] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(
    (lang: string = 'hi-IN') => {
      if (!isSupported) {
        options.onError?.('Speech recognition is not supported in this browser');
        return;
      }

      // Stop any existing session
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          setPartialText(finalText);
          options.onResult?.(finalText);
          setIsListening(false);
        } else if (interimText) {
          setPartialText(interimText);
          options.onPartialResult?.(interimText);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          options.onError?.(event.error || 'Speech recognition error');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
        setPartialText('');
      } catch (e: any) {
        options.onError?.(e.message || 'Could not start speech recognition');
      }
    },
    [isSupported, options]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    partialText,
    isSupported,
    startListening,
    stopListening,
  };
}
