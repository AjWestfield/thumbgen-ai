"use client"

import { type ReactNode } from "react"

interface GlowingShadowProps {
  children: ReactNode
  className?: string
  isFocused?: boolean
}

export function GlowingShadow({ children, className, isFocused }: GlowingShadowProps) {
  return (
    <>
      <style jsx>{`
        @property --rotate {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-x {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-translate-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-size {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-opacity {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-blur {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-scale {
          syntax: "<number>";
          inherits: true;
          initial-value: 2;
        }
        @property --glow-radius {
          syntax: "<number>";
          inherits: true;
          initial-value: 2;
        }
        @property --white-shadow {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }

        .glow-container {
          --card-color: hsl(0deg 0% 9%);
          --card-radius: 1rem;
          --border-width: 2px;
          --bg-size: 1;
          --rotate: 0;
          --animation-speed: 4s;
          --interaction-speed: 0.55s;
          --glow-scale: 1.5;
          --scale-factor: 1;
          --glow-blur: 6;
          --glow-opacity: 0.8;
          --glow-radius: 100;
          --glow-rotate-unit: 1deg;
          --glow-color: 0deg;

          width: 100%;
          color: white;
          display: block;
          position: relative;
          border-radius: var(--card-radius);
          overflow: visible;
        }

        .glow-container:before,
        .glow-container:after {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: var(--card-radius);
          pointer-events: none;
        }

        .glow-content {
          position: relative;
          width: 100%;
          background: transparent;
          border-radius: var(--card-radius);
          z-index: 1;
          overflow: visible;
        }

        .glow-content:before {
          content: "";
          display: block;
          position: absolute;
          top: calc(var(--border-width) * -0.5);
          left: calc(var(--border-width) * -0.5);
          width: calc(100% + var(--border-width));
          height: calc(100% + var(--border-width));
          border-radius: var(--card-radius);
          z-index: -1;
          pointer-events: none;
          background: hsl(0deg 0% 12%) radial-gradient(
            30% 50% at calc(var(--bg-x) * 1%) calc(var(--bg-y) * 1%),
            hsl(var(--glow-color) 85% 60%) calc(0% * var(--bg-size)),
            hsl(var(--glow-color) 85% 50%) calc(20% * var(--bg-size)),
            hsl(var(--glow-color) 85% 40%) calc(40% * var(--bg-size)),
            transparent 100%
          );
          animation: rotate-bg var(--animation-speed) linear infinite;
          transition: --bg-size var(--interaction-speed) ease;
        }

        .glow-container:hover .glow-content:before {
          --bg-size: 12;
          transition: --bg-size var(--interaction-speed) ease;
        }

        .glow-container.is-focused .glow-content:before {
          --bg-size: 12;
          animation: rotate-bg var(--animation-speed) linear infinite, pulse-glow 3s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px 2px hsl(0deg 85% 50% / 0.4),
                        0 0 40px 4px hsl(0deg 85% 50% / 0.2),
                        inset 0 0 20px 2px hsl(0deg 85% 50% / 0.1);
          }
          50% {
            box-shadow: 0 0 30px 6px hsl(0deg 85% 55% / 0.6),
                        0 0 60px 10px hsl(0deg 85% 50% / 0.3),
                        inset 0 0 30px 4px hsl(0deg 85% 50% / 0.15);
          }
        }

        @keyframes rotate-bg {
          0% {
            --bg-x: 0;
            --bg-y: 0;
          }
          25% {
            --bg-x: 100;
            --bg-y: 0;
          }
          50% {
            --bg-x: 100;
            --bg-y: 100;
          }
          75% {
            --bg-x: 0;
            --bg-y: 100;
          }
          100% {
            --bg-x: 0;
            --bg-y: 0;
          }
        }

      `}</style>

      <div className={`glow-container ${isFocused ? 'is-focused' : ''} ${className || ''}`}>
        <div className="glow-content">{children}</div>
      </div>
    </>
  )
}
