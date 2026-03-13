"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function FloatingParticles({ count = 35 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const pts: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 25 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    setParticles(pts);
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <filter id="particleGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="particleGrad">
            <stop offset="0%" stopColor="hsl(220,90%,70%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(220,90%,70%)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {particles.map((p) => (
          <motion.circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill="url(#particleGrad)"
            filter="url(#particleGlow)"
            opacity={p.opacity}
            animate={{
              cx: [`${p.x}%`, `${p.x + (Math.random() - 0.5) * 15}%`, `${p.x + (Math.random() - 0.5) * 10}%`, `${p.x}%`],
              cy: [`${p.y}%`, `${p.y - Math.random() * 12}%`, `${p.y + (Math.random() - 0.5) * 8}%`, `${p.y}%`],
              opacity: [p.opacity, p.opacity * 1.8, p.opacity * 0.5, p.opacity],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}
