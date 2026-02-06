import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  status?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, status, showPercentage = true }: ProgressBarProps) {
  return (
    <div className="w-full" data-testid="progress-bar-container">
      <div className="flex justify-between items-center mb-2">
        {status && (
          <span className="text-sm text-muted-foreground">{status}</span>
        )}
        {showPercentage && (
          <span className="text-sm font-medium" data-testid="progress-percentage">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          data-testid="progress-bar-fill"
        />
      </div>
    </div>
  );
}

interface IndeterminateProgressProps {
  status?: string;
}

export function IndeterminateProgress({ status }: IndeterminateProgressProps) {
  return (
    <div className="w-full" data-testid="indeterminate-progress">
      {status && (
        <span className="text-sm text-muted-foreground mb-2 block">{status}</span>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden relative">
        <motion.div
          className="absolute h-full w-1/3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          animate={{
            x: ["-100%", "400%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}
