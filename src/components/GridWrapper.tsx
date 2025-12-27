import React from 'react';

interface GridWrapperProps {
  children: React.ReactNode;
  className?: string;
  showDots?: boolean;
}

/**
 * GridWrapper Component
 *
 * Creates a dashed grid border effect around content, inspired by StoryShort.ai
 * Features:
 * - Dashed horizontal lines at top/bottom
 * - Dashed vertical lines at left/right
 * - Optional corner dots at intersections
 * - Light/dark theme support
 */
export function GridWrapper({ children, className = '', showDots = false }: GridWrapperProps) {
  return (
    <div className="relative">
      {/* Main Content */}
      <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-background p-10 ${className}`}>
        {children}
      </div>

      {/* Horizontal Line - Top (Dark Theme) */}
      <div
        className="hidden dark:block absolute h-px z-20"
        style={{
          top: 0,
          left: '-10%',
          width: '120%',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 50%, transparent 50%, transparent)',
          backgroundSize: '5px 1px',
        }}
      />

      {/* Horizontal Line - Top (Light Theme) */}
      <div
        className="block dark:hidden absolute h-px z-20"
        style={{
          top: 0,
          left: '-10%',
          width: '120%',
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 50%, transparent 50%, transparent)',
          backgroundSize: '5px 1px',
        }}
      />

      {/* Horizontal Line - Bottom (Dark Theme) */}
      <div
        className="hidden dark:block absolute h-px z-20"
        style={{
          bottom: 0,
          left: '-10%',
          width: '120%',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 50%, transparent 50%, transparent)',
          backgroundSize: '5px 1px',
        }}
      />

      {/* Horizontal Line - Bottom (Light Theme) */}
      <div
        className="block dark:hidden absolute h-px z-20"
        style={{
          bottom: 0,
          left: '-10%',
          width: '120%',
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 50%, transparent 50%, transparent)',
          backgroundSize: '5px 1px',
        }}
      />

      {/* Vertical Line - Right (Dark Theme) */}
      <div
        className="hidden dark:block absolute w-px z-20"
        style={{
          top: '-10%',
          right: 0,
          height: '120%',
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 50%, transparent 50%, transparent)',
          backgroundSize: '1px 5px',
        }}
      />

      {/* Vertical Line - Right (Light Theme) */}
      <div
        className="block dark:hidden absolute w-px z-20"
        style={{
          top: '-10%',
          right: 0,
          height: '120%',
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 50%, transparent 50%, transparent)',
          backgroundSize: '1px 5px',
        }}
      />

      {/* Vertical Line - Left (Dark Theme) */}
      <div
        className="hidden dark:block absolute w-px z-20"
        style={{
          top: '-10%',
          left: 0,
          height: '120%',
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 50%, transparent 50%, transparent)',
          backgroundSize: '1px 5px',
        }}
      />

      {/* Vertical Line - Left (Light Theme) */}
      <div
        className="block dark:hidden absolute w-px z-20"
        style={{
          top: '-10%',
          left: 0,
          height: '120%',
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 50%, transparent 50%, transparent)',
          backgroundSize: '1px 5px',
        }}
      />

      {/* Optional Corner Dots */}
      {showDots && (
        <>
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-neutral-400/50 dark:bg-white/30 z-30"
            style={{ top: -3, left: -3 }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-neutral-400/50 dark:bg-white/30 z-30"
            style={{ top: -3, right: -3 }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-neutral-400/50 dark:bg-white/30 z-30"
            style={{ bottom: -3, left: -3 }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-neutral-400/50 dark:bg-white/30 z-30"
            style={{ bottom: -3, right: -3 }}
          />
        </>
      )}
    </div>
  );
}

/**
 * DotGridBackground Component
 *
 * Creates a full-page dot grid background pattern
 * Can be used as a page background or section background
 */
interface DotGridBackgroundProps {
  children: React.ReactNode;
  className?: string;
  dotColor?: string;
  dotSize?: number;
  gridSpacing?: number;
  animated?: boolean;
}

export function DotGridBackground({
  children,
  className = '',
  dotColor,
  dotSize = 1,
  gridSpacing = 24,
  animated = false,
}: DotGridBackgroundProps) {
  const lightDotColor = dotColor || 'rgba(0, 0, 0, 0.15)';
  const darkDotColor = dotColor || 'rgba(255, 255, 255, 0.15)';

  return (
    <div className={`relative ${className}`}>
      {/* Light theme background */}
      <div
        className={`absolute inset-0 dark:hidden ${animated ? 'animate-pulse' : ''}`}
        style={{
          backgroundImage: `radial-gradient(circle, ${lightDotColor} ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
        }}
      />

      {/* Dark theme background */}
      <div
        className={`absolute inset-0 hidden dark:block ${animated ? 'animate-pulse' : ''}`}
        style={{
          backgroundImage: `radial-gradient(circle, ${darkDotColor} ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default GridWrapper;
