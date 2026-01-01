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
            background: 'linear-gradient(135deg, #2a1a0a 0%, #3a2a1a 25%, #4a3a2a 50%, #3a2a1a 75%, #2a1a0a 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(255, 215, 0, 0.15), 0 0 25px rgba(255, 165, 0, 0.2), 0 0 15px rgba(255, 20, 147, 0.15)',
          }}
        >
          {/* Foil shimmer overlay */}
          <div
            className="absolute inset-0 opacity-30 animate-foil-shimmer rounded-xl"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
          {/* Rainbow holographic gradient animation */}
          <div
            className="absolute inset-0 opacity-35 animate-foil-rotate rounded-xl"
            style={{
              background: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #ff006e)',
              backgroundSize: '200% 200%',
            }}
          />
          {/* Gold base overlay */}
          <div
            className="absolute inset-0 opacity-25 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 223, 0, 0.25) 25%, rgba(255, 215, 0, 0.3) 50%, rgba(255, 223, 0, 0.25) 75%, rgba(255, 215, 0, 0.3) 100%)',
            }}
          />
          {/* Rainbow color overlay - shifting colors */}
          <div
            className="absolute inset-0 opacity-30 rounded-xl animate-foil-rotate"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 110, 0.3) 0%, rgba(131, 56, 236, 0.3) 20%, rgba(58, 134, 255, 0.3) 40%, rgba(6, 255, 165, 0.3) 60%, rgba(255, 190, 11, 0.3) 80%, rgba(255, 0, 110, 0.3) 100%)',
              backgroundSize: '200% 200%',
            }}
          />
          {/* Badge image - on top layer */}
          <img
            alt="Vercel OSS Program"
            src="https://vercel.com/oss/program-badge.svg"
            className="relative z-10 h-7 sm:h-8 transition-transform duration-200 group-hover:scale-105"
          />
        </a>
      </div>
    </div>
  );
}
