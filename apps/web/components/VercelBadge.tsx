// External library imports
// (No external libraries used in this component)

// Type imports
// (No type imports used in this component)

// Internal component imports
// (No internal components used in this component)

// Utility imports
// (No utility functions used in this component)

// ============================================================================
// Main Component
// ============================================================================

/**
 * VercelBadge component
 * Displays the Vercel OSS Program badge with animated foil effects
 * Links to the Vercel OSS program announcement featuring OmniLens
 */
export default function VercelBadge() {
  return (
    <div className="relative z-10 py-12 px-6 md:px-12 lg:px-16 xl:px-24">
      <div className="w-full max-w-2xl mx-auto text-center">
        <a
          href="https://vercel.com/blog/vercel-open-source-program-fall-2025-cohort#omnilens"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block group relative rounded-xl p-5 transition-all duration-200 hover:scale-105 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a1a6e 50%, #2d1b4e 75%, #1a0a2e 100%)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(255, 0, 255, 0.2), 0 0 40px rgba(255, 0, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.3), 0 0 20px rgba(255, 255, 0, 0.3)',
          }}
        >
          {/* Foil shimmer overlay */}
          <div
            className="absolute inset-0 opacity-50 animate-foil-shimmer rounded-xl"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
          {/* Rainbow holographic gradient animation - bright feverdream */}
          <div
            className="absolute inset-0 opacity-60 animate-foil-rotate rounded-xl"
            style={{
              background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00aa, #00ff88, #ff00ff)',
              backgroundSize: '200% 200%',
            }}
          />
          {/* Neon glow overlay */}
          <div
            className="absolute inset-0 opacity-40 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.4) 0%, rgba(0, 255, 255, 0.3) 25%, rgba(255, 255, 0, 0.4) 50%, rgba(0, 255, 136, 0.3) 75%, rgba(255, 0, 255, 0.4) 100%)',
            }}
          />
          {/* Rainbow color overlay - shifting vibrant colors */}
          <div
            className="absolute inset-0 opacity-50 rounded-xl animate-foil-rotate"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.6) 0%, rgba(0, 255, 255, 0.5) 20%, rgba(255, 255, 0, 0.6) 40%, rgba(0, 255, 136, 0.5) 60%, rgba(255, 0, 170, 0.6) 80%, rgba(255, 0, 255, 0.6) 100%)',
              backgroundSize: '200% 200%',
            }}
          />
          {/* Subtle vignette for readability - softer than harsh black */}
          <div
            className="absolute inset-0 z-[5] rounded-xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(30, 10, 50, 0.35) 0%, transparent 70%)',
            }}
          />
          {/* Badge image - soft glow for legibility without harsh black halo */}
          <img
            alt="Vercel OSS Program"
            src="https://vercel.com/oss/program-badge.svg"
            className="relative z-10 h-7 sm:h-8 transition-transform duration-200 group-hover:scale-105"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(255,255,255,0.15))' }}
          />
        </a>
      </div>
    </div>
  );
}
