import { LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  className: string;
}

export interface WorkflowStep {
  n: string;
  t: string;
  d: string;
  icon: LucideIcon;
}

export type DemoStatus = "extracting" | "active";
