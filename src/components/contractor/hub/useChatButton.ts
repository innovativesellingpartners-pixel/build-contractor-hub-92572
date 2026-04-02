import { useState, useRef, useEffect, useCallback } from "react";

interface ChatButtonPosition {
  x: number;
  y: number;
}

export function useChatButton() {
  const [chatButtonPosition, setChatButtonPosition] = useState<ChatButtonPosition | null>(null);
  const [isDraggingChatButton, setIsDraggingChatButton] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [chatButtonDragOffset, setChatButtonDragOffset] = useState({ x: 0, y: 0 });
  const dragStartPosition = useRef<ChatButtonPosition | null>(null);
  const chatButtonRef = useRef<HTMLButtonElement | null>(null);
  const [pocketAgentOpen, setPocketAgentOpen] = useState(false);

  useEffect(() => {
    if (!chatButtonRef.current || chatButtonPosition) return;
    const button = chatButtonRef.current;
    const rect = button.getBoundingClientRect();
    setChatButtonPosition({
      x: window.innerWidth - rect.width - 24,
      y: window.innerHeight - rect.height - 24,
    });
  }, [chatButtonPosition]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingChatButton || !chatButtonRef.current) return;
      const point = e instanceof TouchEvent ? e.touches[0] : (e as MouseEvent);
      if (dragStartPosition.current) {
        const dx = Math.abs(point.clientX - dragStartPosition.current.x);
        const dy = Math.abs(point.clientY - dragStartPosition.current.y);
        if (dx > 5 || dy > 5) setHasDragged(true);
      }
      const newX = point.clientX - chatButtonDragOffset.x;
      const newY = point.clientY - chatButtonDragOffset.y;
      const button = chatButtonRef.current;
      const rect = button.getBoundingClientRect();
      setChatButtonPosition({
        x: Math.max(0, Math.min(newX, window.innerWidth - rect.width)),
        y: Math.max(0, Math.min(newY, window.innerHeight - rect.height)),
      });
    };

    const handleUp = () => {
      if (!isDraggingChatButton) return;
      setIsDraggingChatButton(false);
      dragStartPosition.current = null;
      if (chatButtonPosition) {
        localStorage.setItem("ct1_chat_button_position", JSON.stringify(chatButtonPosition));
      }
    };

    if (isDraggingChatButton) {
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("mouseup", handleUp);
      document.addEventListener("touchend", handleUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchend", handleUp);
    };
  }, [isDraggingChatButton, chatButtonDragOffset, chatButtonPosition]);

  useEffect(() => {
    const saved = localStorage.getItem("ct1_chat_button_position");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setChatButtonPosition(parsed);
      }
    } catch {
      // ignore bad data
    }
  }, []);

  const handleChatButtonDragStart = useCallback(
    (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      if (!chatButtonRef.current) return;
      const point = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
      const rect = chatButtonRef.current.getBoundingClientRect();
      dragStartPosition.current = { x: point.clientX, y: point.clientY };
      setHasDragged(false);
      setChatButtonDragOffset({
        x: point.clientX - rect.left,
        y: point.clientY - rect.top,
      });
      setIsDraggingChatButton(true);
    },
    []
  );

  const handleChatButtonClick = useCallback(() => {
    if (!hasDragged) {
      setPocketAgentOpen((prev) => !prev);
    }
    setHasDragged(false);
  }, [hasDragged]);

  return {
    chatButtonRef,
    chatButtonPosition,
    pocketAgentOpen,
    setPocketAgentOpen,
    handleChatButtonDragStart,
    handleChatButtonClick,
    setChatButtonPosition,
  };
}
