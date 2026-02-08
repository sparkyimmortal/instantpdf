import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
}

const COLORS = [
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f59e0b", "#10b981", "#ef4444", "#f97316",
];

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 720 - 360,
    scale: 0.5 + Math.random() * 0.8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.4,
    duration: 1.5 + Math.random() * 1.5,
    drift: (Math.random() - 0.5) * 60,
  }));
}

export function Confetti({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      setPieces(generatePieces(40));
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                rotate: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                top: "110%",
                left: `${p.x + p.drift}%`,
                rotate: p.rotation,
                scale: p.scale,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute w-3 h-3"
              style={{ backgroundColor: p.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
