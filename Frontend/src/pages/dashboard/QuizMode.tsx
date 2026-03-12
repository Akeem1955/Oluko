import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  LogOut,
  Clock,
  Lightbulb,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

import { cn } from "@/lib/utils/utils";

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  question: string;
  answers: Answer[];
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: "1",
    question:
      "Which CSS property is used to change the text color of an element?",
    answers: [
      { id: "a", text: "background-color", isCorrect: false },
      { id: "b", text: "color", isCorrect: true },
      { id: "c", text: "font-color", isCorrect: false },
      { id: "d", text: "text-style", isCorrect: false },
    ],
    explanation:
      "The color property specifically sets the foreground color of the text content.",
  },
];

export default function QuizMode() {
  const [currentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>("b");
  const [showFeedback, setShowFeedback] = useState(true);
  const [timeLeft] = useState({ minutes: 4, seconds: 12 });

  const question = QUESTIONS[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / 8) * 100;
  const isCorrect = question?.answers.find(
    (a) => a.id === selectedAnswer,
  )?.isCorrect;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <div className="sticky top-0 z-30 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="px-6 py-4 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              Olùkọ́
            </h1>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Exit Quiz <LogOut className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-6 lg:p-10 relative">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8 lg:sticky lg:top-32"
          >
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-primary uppercase tracking-wider mb-4">
                Question {currentQuestionIndex + 1} of 8
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight text-gray-900 dark:text-white tracking-tight">
                {question?.question}
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
                <Clock className="w-4 h-4" />
                <span>Time Remaining</span>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-400">Min</span>
                </div>
                <span className="text-2xl font-bold text-gray-300 dark:text-gray-600 self-start mt-2">
                  :
                </span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-400">Sec</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-full h-40 rounded-2xl overflow-hidden relative mt-4 opacity-80">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <div className="flex items-center gap-2 text-primary/60">
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Tip: Think about the foreground.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4 w-full"
          >
            {question?.answers.map((answer) => {
              const isSelected = selectedAnswer === answer.id;
              return (
                <label
                  key={answer.id}
                  className={cn(
                    "group relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer h-[80px]",
                    isSelected
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-glow"
                      : "border-transparent bg-white dark:bg-gray-800 shadow-soft hover:shadow-lg hover:border-primary/30",
                  )}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={answer.id}
                    checked={isSelected}
                    onChange={() => setSelectedAnswer(answer.id)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-gray-300 dark:border-gray-600",
                    )}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-lg font-medium transition-colors",
                      isSelected
                        ? "text-primary font-bold"
                        : "text-gray-900 dark:text-white group-hover:text-primary",
                    )}
                  >
                    {answer.text}
                  </span>
                  {isSelected && (
                    <div className="absolute right-5 text-primary">
                      <Check className="w-6 h-6" />
                    </div>
                  )}
                </label>
              );
            })}
            <div className="mt-6 flex justify-end">
              <Button size="lg" onClick={() => setShowFeedback(true)}>
                Check Answer <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setShowFeedback(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div
                className={cn(
                  "h-24 w-full flex items-center justify-center relative overflow-hidden",
                  isCorrect ? "bg-success/10" : "bg-error/10",
                )}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `radial-gradient(${isCorrect ? "#10B981" : "#EF4444"} 1px, transparent 1px)`,
                    backgroundSize: "10px 10px",
                  }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-gray-800 z-10",
                    isCorrect ? "bg-success" : "bg-error",
                  )}
                >
                  {isCorrect ? (
                    <Check className="w-8 h-8 text-white" />
                  ) : (
                    <X className="w-8 h-8 text-white" />
                  )}
                </motion.div>
              </div>
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {isCorrect ? "Correct!" : "Not quite!"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  {isCorrect ? (
                    <>
                      Great job! The{" "}
                      <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-primary font-mono text-sm">
                        color
                      </code>{" "}
                      property specifically sets the foreground color of the
                      text content.
                    </>
                  ) : (
                    "The correct answer is different. Review the material and try again!"
                  )}
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowFeedback(false)}
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
