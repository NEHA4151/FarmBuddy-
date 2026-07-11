import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export default function AnimatedCounter({ value, className = '' }) {
  const [count, setCount] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => setCount(Math.round(latest))
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{count}</span>;
}
