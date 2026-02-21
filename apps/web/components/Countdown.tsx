"use client";

// External library imports
import { useEffect, useMemo, useState } from "react";

// Internal imports
import styles from "./Countdown.module.css";

// ============================================================================
// Type Definitions
// ============================================================================

export interface CountdownProps {
  /** Target date for the countdown (ISO string or Date) */
  targetDate: Date | string;
  /** Message to display when countdown reaches zero */
  endMessage?: string;
  /** Optional label above the countdown (e.g., "Launching in") */
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates time remaining until target date
 * @param target - Target date for countdown
 * @returns Object with days, hours, minutes, seconds and total milliseconds
 */
function getTimeLeft(target: Date): TimeLeft {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total: diff };
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Countdown component with oss-update aesthetic
 * Displays days, hours, minutes, and seconds until a target date
 * Styled with dark theme, accent colors, and subtle borders
 */
export default function Countdown({
  targetDate,
  endMessage = "Now live!",
  label = "Launching in",
}: CountdownProps) {
  const target = useMemo(
    () => (typeof targetDate === "string" ? new Date(targetDate) : targetDate),
    [targetDate]
  );
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getTimeLeft(target);
      setTimeLeft(next);
      if (next.total <= 0) clearInterval(timer);
    }, 1000);

    // Defer mounted state to avoid setState-in-effect lint (hydration-safe)
    const mountedId = requestAnimationFrame(() => setMounted(true));

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(mountedId);
    };
  }, [target]);

  // Avoid hydration mismatch: render placeholder until mounted
  if (!mounted) {
    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          <span className={styles.label}>{label}</span>
          <div className={styles.grid}>
            {["—", "—", "—", "—"].map((val, i) => (
              <div key={i} className={styles.unit}>
                <span className={styles.value}>{val}</span>
                <span className={styles.unitLabel}>
                  {["Days", "Hours", "Mins", "Secs"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (timeLeft.total <= 0) {
    return (
      <div className={styles.root}>
        <div className={`${styles.inner} ${styles.innerEnded}`}>
          <span className={styles.endMessage}>{endMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <span className={styles.label}>{label}</span>
        <div className={styles.grid}>
          <div className={styles.unit}>
            <span className={styles.value}>{timeLeft.days}</span>
            <span className={styles.unitLabel}>Days</span>
          </div>
          <div className={styles.unit}>
            <span className={styles.value}>{timeLeft.hours}</span>
            <span className={styles.unitLabel}>Hours</span>
          </div>
          <div className={styles.unit}>
            <span className={styles.value}>{timeLeft.minutes}</span>
            <span className={styles.unitLabel}>Mins</span>
          </div>
          <div className={styles.unit}>
            <span className={styles.value}>{timeLeft.seconds}</span>
            <span className={styles.unitLabel}>Secs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
