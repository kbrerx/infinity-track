"use client";

import { motion } from "framer-motion";

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function SparkLine({ data, color = "hsl(263.4,70%,60%)", height = 40, width = 100 }: SparkLineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const lastX = parseFloat(points[points.length - 1]);
  const lastY = parseFloat(points[points.length - 1].split(",")[1]);

  const area = `M 0,${height} L ${points[0].split(",")[0]},${points[0].split(",")[1]} ${points.slice(1).map(p => `L ${p}`).join(" ")} L ${width},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="sparkGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.path
        d={area}
        fill="url(#sparkGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />

      <motion.polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#sparkGlow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut", delay: 0.1 }}
      />

      <motion.circle
        cx={lastX}
        cy={lastY}
        r="2.5"
        fill={color}
        filter="url(#sparkGlow)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
    </svg>
  );
}
