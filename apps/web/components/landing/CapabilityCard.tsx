"use client";

import { ReactNode } from "react";
import { useTrackMouse } from "@/lib/hooks/useTrackMouse";

interface CapabilityCardProps {
  mock: ReactNode;
  num: string;
  title: string;
  desc: string;
  tag: ReactNode;
  id?: string;
}

export function CapabilityCard({
  mock,
  num,
  title,
  desc,
  tag,
  id,
}: CapabilityCardProps) {
  const onMouseMove = useTrackMouse();

  return (
    <div className="card" onMouseMove={onMouseMove} id={id}>
      <div className="card-glow" />
      <div className="card-mock">{mock}</div>
      <div className="card-body">
        <span className="card-num">{num}</span>
        <div className="card-title">{title}</div>
        <div className="card-desc">{desc}</div>
        <div className="card-tag">{tag}</div>
      </div>
    </div>
  );
}
