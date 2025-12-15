import { useState, useEffect, useRef, useCallback } from "react";

interface UseTypewriterOptions {
  speed?: number; // Characters per second
  minDelay?: number; // Minimum delay between characters (ms)
  maxDelay?: number; // Maximum delay for variation
  punctuationDelay?: number; // Extra delay for punctuation
  enabled?: boolean;
}

export const useTypewriter = (
  targetText: string,
  options: UseTypewriterOptions = {}
) => {
  const {
    speed = 60,
    minDelay = 10,
    maxDelay = 40,
    punctuationDelay = 100,
    enabled = true
  } = options;

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);
  const previousTextRef = useRef("");

  const getDelay = useCallback((char: string): number => {
    // Add variation to make it feel more natural
    const baseDelay = 1000 / speed;
    const variation = Math.random() * (maxDelay - minDelay) + minDelay;
    
    // Extra delay for punctuation
    if (['.', '!', '?', ',', ';', ':'].includes(char)) {
      return baseDelay + punctuationDelay + variation;
    }
    
    // Slight pause for newlines
    if (char === '\n') {
      return baseDelay + 50 + variation;
    }
    
    // Quick for spaces
    if (char === ' ') {
      return Math.max(minDelay, baseDelay * 0.5);
    }
    
    return baseDelay + variation;
  }, [speed, minDelay, maxDelay, punctuationDelay]);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(targetText);
      setIsComplete(true);
      setIsTyping(false);
      return;
    }

    // Check if this is new text being appended
    if (targetText.startsWith(previousTextRef.current) && previousTextRef.current !== targetText) {
      // Continue from where we left off
      currentIndexRef.current = previousTextRef.current.length;
    } else if (!targetText.startsWith(displayedText)) {
      // Reset if text is completely different
      currentIndexRef.current = 0;
      setDisplayedText("");
    }

    previousTextRef.current = targetText;

    if (currentIndexRef.current >= targetText.length) {
      setIsComplete(true);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setIsComplete(false);

    const typeNextChar = () => {
      if (currentIndexRef.current < targetText.length) {
        const nextIndex = currentIndexRef.current + 1;
        const currentChar = targetText[currentIndexRef.current];
        
        setDisplayedText(targetText.slice(0, nextIndex));
        currentIndexRef.current = nextIndex;
        
        const delay = getDelay(currentChar);
        timeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsTyping(false);
        setIsComplete(true);
      }
    };

    timeoutRef.current = setTimeout(typeNextChar, getDelay(targetText[currentIndexRef.current] || ' '));

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [targetText, enabled, getDelay]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    currentIndexRef.current = 0;
    previousTextRef.current = "";
    setDisplayedText("");
    setIsTyping(false);
    setIsComplete(false);
  }, []);

  const skipToEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    currentIndexRef.current = targetText.length;
    setDisplayedText(targetText);
    setIsTyping(false);
    setIsComplete(true);
  }, [targetText]);

  return {
    displayedText,
    isTyping,
    isComplete,
    reset,
    skipToEnd,
    progress: targetText.length > 0 ? (displayedText.length / targetText.length) * 100 : 0
  };
};
