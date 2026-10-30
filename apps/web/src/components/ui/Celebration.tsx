import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotate: number;
  duration: number;
  delay: number;
}

const CONFETTI_COLORS = [
  '#0ea5e9', // primary sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#3b82f6', // blue
];

interface CelebrationProps {
  active: boolean;
  onComplete?: () => void;
  message?: string;
}

export const Celebration: React.FC<CelebrationProps> = ({
  active,
  onComplete,
  message = 'All tasks caught up! Outstanding work 🎉',
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate 45 randomized confetti particles
    const generated: Particle[] = Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage across viewport
      y: -10,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 6,
      rotate: Math.random() * 360,
      duration: Math.random() * 1.5 + 1.8,
      delay: Math.random() * 0.3,
    }));

    setParticles(generated);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 2800);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!active && particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-24 overflow-hidden"
      aria-live="polite"
    >
      {/* Confetti Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Floating Congratulatory Pill */}
      {message && (
        <div className="animate-in fade-in zoom-in-95 duration-300 px-4 py-2 rounded-full bg-surface/95 border border-primary/30 shadow-popover backdrop-blur-md text-xs font-semibold text-text flex items-center gap-2">
          <span>✨</span>
          <span>{message}</span>
          <span>✨</span>
        </div>
      )}
    </div>
  );
};

