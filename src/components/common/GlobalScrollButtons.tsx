import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

const GlobalScrollButtons: React.FC = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check scroll position and handle keyboard scrolling
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      setScrollPosition(position);
      setIsAtTop(position < 50);
      setIsAtBottom(position >= maxScroll - 50);
      setIsScrolling(false);
    };

    // Keyboard scrolling handler
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      let scrollAmount = 0;
      let shouldScroll = false;

      switch (e.key) {
        case 'ArrowUp':
          scrollAmount = -100;
          shouldScroll = true;
          break;
        case 'ArrowDown':
          scrollAmount = 100;
          shouldScroll = true;
          break;
        case 'PageUp':
          scrollAmount = -window.innerHeight * 0.8;
          shouldScroll = true;
          break;
        case 'PageDown':
          scrollAmount = window.innerHeight * 0.8;
          shouldScroll = true;
          break;
        case 'Home':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        case 'End':
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
          return;
        case ' ':
          // Space bar - scroll down (unless shift is held)
          if (!e.shiftKey) {
            e.preventDefault();
            scrollAmount = window.innerHeight * 0.8;
            shouldScroll = true;
          }
          break;
      }

      if (shouldScroll && scrollAmount !== 0) {
        e.preventDefault();
        setIsScrolling(true);
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Real-time continuous scrolling with increased range
  const startScrollingUp = () => {
    if (scrollIntervalRef.current) return;
    setIsScrollingUp(true);
    setIsScrolling(true);
    
    scrollIntervalRef.current = setInterval(() => {
      window.scrollBy({ top: -40, behavior: 'auto' });
    }, 16); // ~60fps for smooth scrolling with increased range
  };

  const startScrollingDown = () => {
    if (scrollIntervalRef.current) return;
    setIsScrollingDown(true);
    setIsScrolling(true);
    
    scrollIntervalRef.current = setInterval(() => {
      window.scrollBy({ top: 40, behavior: 'auto' });
    }, 16); // ~60fps for smooth scrolling with increased range
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsScrollingUp(false);
    setIsScrollingDown(false);
    setIsScrolling(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {/* Scroll to Top Button - Real-time continuous scrolling */}
      <motion.button
        onMouseDown={startScrollingUp}
        onMouseUp={stopScrolling}
        onMouseLeave={stopScrolling}
        onTouchStart={startScrollingUp}
        onTouchEnd={stopScrolling}
        className="fixed right-6 bottom-24 z-[9999] p-3 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 backdrop-blur-md border-2 border-cyan-400/40 text-cyan-200 hover:text-cyan-100 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] hover:border-cyan-400/60"
        initial={{ opacity: 0.6, scale: 0.95 }}
        animate={{ 
          opacity: isAtTop ? 0.4 : (isScrollingUp ? 1 : 0.7),
          scale: isScrollingUp ? 1.1 : 1,
          y: 0
        }}
        whileHover={{ 
          opacity: 1, 
          scale: 1.15,
          boxShadow: '0 0 30px rgba(6,182,212,0.8), 0 0 50px rgba(6,182,212,0.5)'
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))'
        }}
        disabled={isAtTop}
      >
        <ChevronUp size={20} className={isScrollingUp ? 'animate-pulse' : ''} />
      </motion.button>

      {/* Scroll to Bottom Button - Real-time continuous scrolling */}
      <motion.button
        onMouseDown={startScrollingDown}
        onMouseUp={stopScrolling}
        onMouseLeave={stopScrolling}
        onTouchStart={startScrollingDown}
        onTouchEnd={stopScrolling}
        className="fixed right-6 bottom-6 z-[9999] p-3 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-md border-2 border-blue-400/40 text-blue-200 hover:text-blue-100 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] hover:border-blue-400/60"
        initial={{ opacity: 0.6, scale: 0.95 }}
        animate={{ 
          opacity: isAtBottom ? 0.4 : (isScrollingDown ? 1 : 0.7),
          scale: isScrollingDown ? 1.1 : 1,
          y: 0
        }}
        whileHover={{ 
          opacity: 1, 
          scale: 1.15,
          boxShadow: '0 0 30px rgba(59,130,246,0.8), 0 0 50px rgba(59,130,246,0.5)'
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15, delay: 0.05 }}
        style={{
          filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))'
        }}
        disabled={isAtBottom}
      >
        <ChevronDown size={20} className={isScrollingDown ? 'animate-pulse' : ''} />
      </motion.button>

      {/* Keyboard hint indicator */}
      {isScrolling && (
        <motion.div
          className="fixed right-6 bottom-44 z-[9998] px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-cyan-400/30 text-cyan-300/80 text-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          ⌨️ Keyboard scrolling active
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalScrollButtons;

