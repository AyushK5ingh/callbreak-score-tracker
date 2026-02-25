import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const THRESHOLD = 80;
const MAX_PULL = 120;

const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e) => {
    // Only activate when scrolled to the top
    if (window.scrollY === 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      // Diminishing pull with resistance
      const dist = Math.min(delta * 0.5, MAX_PULL);
      setPullDistance(dist);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none"
          style={{ top: 0 }}
        >
          <motion.div
            animate={{ y: pullDistance - 40 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-10 h-10 rounded-full bg-primary-500/20 backdrop-blur-sm border border-primary-500/30 flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}
            >
              <svg
                className="w-5 h-5 text-primary-500 transition-transform"
                style={{ transform: `rotate(${progress * 360}deg)` }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                {refreshing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                )}
              </svg>
            </div>
            {pullDistance >= THRESHOLD && !refreshing && (
              <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-1">Release</span>
            )}
            {refreshing && (
              <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-1">Syncing...</span>
            )}
          </motion.div>
        </div>
      )}

      {/* Content with pull transform */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: pulling.current ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
