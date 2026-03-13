"use client";

import { motion } from "framer-motion";

export function InfinityLogo({ size = 36 }: { size?: number }) {
  const w = size;
  const h = size * 0.5;

  // Clean mathematical lemniscate (infinity) path using cubic beziers
  const infinityPath =
    "M 20,22 C 20,10 8,10 8,22 C 8,34 20,34 40,22 C 60,10 72,10 72,22 C 72,34 60,34 60,22 C 60,10 72,10 72,22 C 72,34 60,34 40,22 C 20,10 8,10 8,22 C 8,34 20,34 20,22 Z";

  // Simpler cleaner version
  const path =
    "M 40,22 C 26,4 4,4 4,22 C 4,40 26,40 40,22 C 54,4 76,4 76,22 C 76,40 54,40 40,22 Z";

  return (
    <div className="relative flex items-center justify-center" style={{ width: w, height: h }}>
      <svg
        viewBox="0 0 80 44"
        width={w}
        height={h}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Primary gradient blue→purple→cyan */}
          <linearGradient id="infGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(220, 90%, 65%)" />
            <stop offset="50%" stopColor="hsl(270, 85%, 60%)" />
            <stop offset="100%" stopColor="hsl(190, 90%, 55%)" />
          </linearGradient>
          {/* Secondary gradient — shifted hue */}
          <linearGradient id="infGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(270, 80%, 65%)" />
            <stop offset="100%" stopColor="hsl(220, 90%, 70%)" />
          </linearGradient>
          {/* Wide soft glow */}
          <filter id="glowWide" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b1" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="b1" />
              <feMergeNode in="b1" />
            </feMerge>
          </filter>
          {/* Medium glow */}
          <filter id="glowMed" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Tight glow for the core */}
          <filter id="glowCore" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.8" result="b3" />
            <feMerge>
              <feMergeNode in="b3" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* LAYER 1: Wide outer glow (the "atmosphere") */}
        <motion.path
          d={path}
          stroke="hsl(260, 80%, 55%)"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#glowWide)"
          opacity="0.35"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.35 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />

        {/* LAYER 2: Secondary trail — offset animation */}
        <motion.path
          d={path}
          stroke="url(#infGrad2)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glowMed)"
          opacity="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.4, ease: "easeInOut", delay: 0.15 }}
        />

        {/* LAYER 3: Main neon stroke */}
        <motion.path
          d={path}
          stroke="url(#infGrad1)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#glowMed)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.1 }}
        />

        {/* LAYER 4: White-hot core */}
        <motion.path
          d={path}
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
          filter="url(#glowCore)"
          opacity="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.25 }}
        />

        {/* LAYER 5: Orbiting energy pulse */}
        <motion.circle
          r="1.8"
          fill="white"
          filter="url(#glowMed)"
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, ease: "linear", repeat: Infinity, delay: 1.5 }}
          style={{
            offsetPath: `path('${path}')`,
          }}
        />
      </svg>
    </div>
  );
}
