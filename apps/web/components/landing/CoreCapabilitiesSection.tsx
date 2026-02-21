"use client";

import { useEffect } from "react";
import { AddIcon } from "./icons";
import { CapabilityCard } from "./CapabilityCard";

const METRICS_CARD_ID = "metrics-card";

interface SigLine {
  ts: string;
  type: "sig-pass" | "sig-fail" | "sig-skip" | "sig-info";
  msg: string;
  withCursor?: boolean;
}

const SIG_LINES: SigLine[] = [
  { ts: "14:22:01", type: "sig-pass", msg: "build / ubuntu-latest → success" },
  { ts: "14:22:03", type: "sig-info", msg: "lint / node20 → completed" },
  {
    ts: "14:22:07",
    type: "sig-pass",
    msg: "test / matrix[3.11] → 214 passed",
  },
  { ts: "14:22:09", type: "sig-fail", msg: "deploy / prod → timeout 30s" },
  { ts: "14:22:12", type: "sig-skip", msg: "e2e / staging → skipped" },
  {
    ts: "14:22:14",
    type: "sig-pass",
    msg: "security / codeql → 0 alerts",
  },
  {
    ts: "14:22:18",
    type: "sig-info",
    msg: "release / changelog → pending",
  },
  {
    ts: "14:22:21",
    type: "sig-pass",
    msg: "build / windows-latest →",
    withCursor: true,
  },
];

const REPO_ROWS = [
  {
    iconBg: "rgba(0,229,160,0.1)",
    stroke: "#00e5a0",
    name: "omnilens/core",
    status: "g",
    statusText: "healthy",
  },
  {
    iconBg: "rgba(77,159,255,0.1)",
    stroke: "#4d9fff",
    name: "org/api-gateway",
    status: "g",
    statusText: "healthy",
  },
  {
    iconBg: "rgba(245,158,11,0.1)",
    stroke: "#f59e0b",
    name: "org/data-pipeline",
    status: "y",
    statusText: "degraded",
  },
  {
    iconBg: "rgba(239,68,68,0.1)",
    stroke: "#ef4444",
    name: "org/deploy-infra",
    status: "r",
    statusText: "failing",
  },
] as const;

export function CoreCapabilitiesSection() {
  useEffect(() => {
    const card = document.getElementById(METRICS_CARD_ID);
    if (!card) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const bars = card.querySelectorAll<HTMLElement>(
          ".metric-bar-fill[data-width]"
        );
        bars.forEach((bar) => {
          const w = bar.dataset.width;
          if (w) bar.style.width = `${w}%`;
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(card);
    return () => obs.disconnect();
  }, []);

  const sparkGradId = "sGrad-landing";

  return (
    <section className="section">
      <div className="section-header">
        <div className="eyebrow">Core Capabilities</div>
        <h2 className="section-title">
          The building blocks behind
          <br />
          <em>workflow health visibility.</em>
        </h2>
        <p className="section-sub">
          {"// three primitives. one unified view."}
        </p>
      </div>

      <div className="cards">
        <CapabilityCard
          num="01 —"
          title="Repository Management"
          desc="Add and manage repositories from a central dashboard."
          mock={
            <div className="mock-wrap">
              <div className="mock-topbar">
                <span className="mock-topbar-label">Repositories</span>
                <span className="mock-pill green">4 connected</span>
              </div>
              {REPO_ROWS.map((row) => (
                <div key={row.name} className="repo-row">
                  <div
                    className="repo-icon-sq"
                    style={{ background: row.iconBg }}
                  >
                    <AddIcon width={10} height={10} stroke={row.stroke} />
                  </div>
                  <span className="repo-name">{row.name}</span>
                  <span className="status-chip">
                    <span className={`sdot ${row.status}`} />
                    {row.statusText}
                  </span>
                </div>
              ))}
            </div>
          }
          tag={
            <>
              <span
                className="sdot g"
                style={{ animation: "landing-pulse-dot 2s infinite" }}
              />
              Central dashboard
            </>
          }
        />

        <CapabilityCard
          num="02 —"
          title="Signal Ingestion"
          desc="Ingest workflow signals from tests, checks, and jobs. Collect comprehensive data from all your GitHub Actions workflows."
          mock={
            <div className="mock-wrap">
              <div className="mock-topbar">
                <span className="mock-topbar-label">Live stream</span>
                <span className="mock-pill blue">ingesting</span>
              </div>
              {SIG_LINES.map((line, i) => (
                <div key={i} className="sig-line">
                  <span className="sig-ts">{line.ts}</span>
                  <span className={`sig-type ${line.type}`}>
                    {line.type === "sig-pass"
                      ? "PASS"
                      : line.type === "sig-fail"
                        ? "FAIL"
                        : line.type === "sig-skip"
                          ? "SKIP"
                          : "CHECK"}
                  </span>
                  <span className="sig-msg">
                    {line.msg}
                    {line.withCursor && <span className="cursor-blink" />}
                  </span>
                </div>
              ))}
            </div>
          }
          tag={
            <>
              <span
                className="sdot"
                style={{
                  background: "var(--accent2)",
                  boxShadow: "0 0 5px var(--accent2)",
                  animation: "landing-pulse-dot 2s infinite",
                }}
              />
              Real-time events
            </>
          }
        />

        <CapabilityCard
          id={METRICS_CARD_ID}
            num="03 —"
            title="Metrics & State Visualization"
            desc="Track workflow health using success rates, run counts, runtimes, and stability trends."
            mock={
              <div className="mock-wrap">
                <div className="mock-topbar">
                  <span className="mock-topbar-label">Health overview</span>
                  <span className="mock-pill purple">last 7d</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Success</span>
                  <div className="metric-bar-wrap">
                    <div
                      className="metric-bar-fill g"
                      data-width="94"
                    />
                  </div>
                  <span className="metric-val">94.2%</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Run count</span>
                  <div className="metric-bar-wrap">
                    <div
                      className="metric-bar-fill b"
                      data-width="73"
                    />
                  </div>
                  <span className="metric-val">1,847</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Avg runtime</span>
                  <div className="metric-bar-wrap">
                    <div
                      className="metric-bar-fill p"
                      data-width="58"
                    />
                  </div>
                  <span className="metric-val">3m 41s</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Stability</span>
                  <div className="metric-bar-wrap">
                    <div
                      className="metric-bar-fill a"
                      data-width="81"
                    />
                  </div>
                  <span className="metric-val">81%</span>
                </div>
                <div className="spark-wrap">
                  <div className="spark-label">Success trend</div>
                  <svg
                    className="spark-svg"
                    viewBox="0 0 260 38"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id={sparkGradId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#c084fc"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="#c084fc"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <path
                      className="spark-area"
                      d="M0,28 L26,25 L52,30 L78,18 L104,20 L130,15 L156,22 L182,10 L208,6 L234,8 L260,4 L260,38 L0,38 Z"
                      style={{ fill: `url(#${sparkGradId})` }}
                    />
                    <path
                      className="spark-path"
                      d="M0,28 L26,25 L52,30 L78,18 L104,20 L130,15 L156,22 L182,10 L208,6 L234,8 L260,4"
                    />
                  </svg>
                </div>
              </div>
            }
            tag={
              <>
                <span
                  className="sdot"
                  style={{
                    background: "var(--accent3)",
                    boxShadow: "0 0 5px var(--accent3)",
                    animation: "landing-pulse-dot 2s infinite",
                  }}
                />
                Live analytics
              </>
            }
          />
      </div>
    </section>
  );
}
