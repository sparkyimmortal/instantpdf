import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { hapticFeedback } from "@/hooks/use-haptic";

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  threshold?: number;
}

export function SwipeToDelete({ children, onDelete, threshold = 100 }: SwipeToDeleteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const iconScale = useTransform(x, [-threshold, -threshold / 2, 0], [1.2, 0.8, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x < -threshold) {
      hapticFeedback("medium");
      onDelete();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      <motion.div
        className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-lg"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: iconScale }}>
          <Trash2 className="h-5 w-5 text-white" />
        </motion.div>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-card z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
