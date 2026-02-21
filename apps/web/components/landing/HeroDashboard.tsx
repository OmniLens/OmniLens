"use client";

import { useEffect, useRef } from "react";
import {
  OmniLensLogo,
  GridIcon,
  ListIcon,
  AddIcon,
  WorkflowIcon,
  CheckIcon,
} from "./icons";

interface RepoCard {
  avatar: string;
  avatarBg: string;
  name: string;
  rate: string;
  rateClass: string;
  rateStyle?: React.CSSProperties;
  barClass: string;
  barWidth: number;
  barStyle?: React.CSSProperties;
  workflows: number;
  checks: number;
}

const REPO_CARDS: RepoCard[] = [
  {
    avatar: "O",
    avatarBg: "var(--accent)",
    name: "omnilens/core",
    rate: "98.4%",
    rateClass: "high",
    barClass: "full",
    barWidth: 98,
    workflows: 312,
    checks: 8,
  },
  {
    avatar: "A",
    avatarBg: "var(--accent2)",
    name: "org/api-gateway",
    rate: "96.1%",
    rateClass: "high",
    barClass: "full",
    barWidth: 96,
    workflows: 528,
    checks: 12,
  },
  {
    avatar: "F",
    avatarBg: "var(--accent3)",
    name: "org/frontend",
    rate: "91.2%",
    rateClass: "high",
    barClass: "hi",
    barWidth: 91,
    workflows: 204,
    checks: 6,
  },
  {
    avatar: "D",
    avatarBg: "#f59e0b",
    name: "org/data-pipeline",
    rate: "67.1%",
    rateClass: "",
    rateStyle: { color: "#f59e0b", fontWeight: 600 },
    barClass: "med",
    barWidth: 67,
    workflows: 89,
    checks: 3,
  },
  {
    avatar: "D",
    avatarBg: "#ef4444",
    name: "org/deploy-infra",
    rate: "41.8%",
    rateClass: "",
    rateStyle: { color: "#ef4444", fontWeight: 600 },
    barClass: "",
    barWidth: 42,
    barStyle: {
      background: "linear-gradient(90deg,#ef4444,#f87171)",
    },
    workflows: 61,
    checks: 2,
  },
  {
    avatar: "A",
    avatarBg: "#6366f1",
    name: "org/auth-service",
    rate: "99.1%",
    rateClass: "high",
    barClass: "full",
    barWidth: 99,
    workflows: 653,
    checks: 9,
  },
];

export function HeroDashboard() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gridRef.current) return;
      const bars = gridRef.current.querySelectorAll<HTMLElement>(
        ".drc-bar[data-w]"
      );
      bars.forEach((bar) => {
        const w = bar.dataset.w;
        if (w) bar.style.width = `${w}%`;
      });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hero-dashboard">
      <div className="dash-titlebar">
        <div className="dash-titlebar-left">
          <span className="dash-wdot r" />
          <span className="dash-wdot y" />
          <span className="dash-wdot g" />
          <span className="dash-titlebar-url">omnilens.xyz/dashboard</span>
        </div>
        <div style={{ width: 1 }} />
      </div>
      <div className="dash-chrome">
        <div className="dash-sidebar">
          <div className="dash-sidebar-icon active">
            <OmniLensLogo width={14} height={14} useCurrentColor />
          </div>
          <div className="dash-sidebar-icon">
            <GridIcon width={14} height={14} />
          </div>
          <div className="dash-sidebar-icon">
            <ListIcon width={14} height={14} />
          </div>
        </div>
        <div className="dash-main">
          <div className="dash-page-header">
            <span className="dash-page-title">Repositories</span>
            <div className="dash-add-btn">
              <AddIcon width={10} height={10} />
              Add Repo
            </div>
          </div>
          <div className="dash-repo-grid" ref={gridRef}>
            {REPO_CARDS.map((card) => (
              <div key={card.name} className="dash-repo-card">
                <div className="drc-head">
                  <div
                    className="drc-avatar"
                    style={{ background: card.avatarBg }}
                  >
                    {card.avatar}
                  </div>
                  <span className="drc-name">{card.name}</span>
                  <span className="drc-pub-badge">
                    <span className="drc-pub-dot" />
                    Public
                  </span>
                </div>
                <div className="drc-rate-row">
                  <span>Daily Success Rate</span>
                  <span
                    className={`drc-rate-val ${card.rateClass}`}
                    style={card.rateStyle}
                  >
                    {card.rate}
                  </span>
                </div>
                <div className="drc-bar-wrap">
                  <div
                    className={`drc-bar ${card.barClass}`.trim()}
                    data-w={card.barWidth}
                    style={card.barStyle}
                  />
                </div>
                <div className="drc-footer">
                  <span className="drc-meta-item">
                    <WorkflowIcon width={9} height={9} />
                    {card.workflows} workflows
                  </span>
                  <span className="drc-meta-item">
                    <CheckIcon width={9} height={9} />
                    {card.checks} checks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
