import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: string;
}

/**
 * AnimatedNumber smoothly counts up from 0 to the target number.
 * Supports suffixes like '+', 'K', 'M' etc.
 */
export default function AnimatedNumber({ value }: AnimatedNumberProps) {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const match = value.match(/^([0-9,.]+)([A-Za-z+]+)$/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const numStr = match[1].replace(/,/g, '');
    const base = parseFloat(numStr);
    const suffix = match[2];
    const duration = 1500;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = base * progress;
      const formatted =
        (base >= 1000 ? Math.round(current).toLocaleString() : current.toFixed(1)) +
        suffix;
      setDisplay(formatted);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span>{display}</span>;
}
