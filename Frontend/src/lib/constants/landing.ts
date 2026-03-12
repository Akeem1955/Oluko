import { Mic, FileText, PenTool, Brain } from "lucide-react";
import { Feature, WorkflowStep } from "@/lib/types/landing";

export const FEATURES: Feature[] = [
  {
    icon: FileText,
    title: "Curriculum Generation",
    description:
      "Upload a PDF, a video (up to 25 MB), or simply type a topic. Olùkọ́'s AI instantly builds a structured course with clear lessons and objectives.",
    gradient: "from-blue-600 to-blue-700",
    className: "",
  },
  {
    icon: Mic,
    title: "Voice AI Tutor",
    description:
      "Join a live voice session with your AI instructor. It speaks, listens, explains concepts, and adapts to your pace — like a private tutor in your headphones.",
    gradient: "from-blue-600 to-blue-700",
    className: "",
  },
  {
    icon: PenTool,
    title: "Interactive Whiteboard",
    description:
      "While the AI teaches, it draws diagrams, renders code, and projects visuals on a shared whiteboard in real time — just like a real classroom.",
    gradient: "from-blue-600 to-blue-700",
    className: "",
  },
  {
    icon: Brain,
    title: "Concentration Mode",
    description:
      "Upload your study material and let the AI quiz you on it through voice. A focused self-study mode designed to lock in understanding.",
    gradient: "from-blue-600 to-blue-700",
    className: "",
  },
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    n: "01",
    t: "Bring Your Material",
    d: "Upload a PDF, a short video (up to 25 MB), or type any topic you want to learn.",
    icon: FileText,
  },
  {
    n: "02",
    t: "AI Builds Your Curriculum",
    d: "In seconds, a structured course with clear lessons and objectives is generated — ready for you to start.",
    icon: Brain,
  },
  {
    n: "03",
    t: "Learn Through Voice",
    d: "Join a live voice session where the AI tutor explains, asks questions, and draws on a whiteboard in real time.",
    icon: Mic,
  },
  {
    n: "04",
    t: "Lock It In",
    d: "Switch to Concentration Mode. The AI quizzes you via voice on your material until the concepts stick.",
    icon: Brain,
  },
];
