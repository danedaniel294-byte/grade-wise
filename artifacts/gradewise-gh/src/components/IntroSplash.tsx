import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, GraduationCap, Target, TrendingUp, Award, ChevronRight } from "lucide-react";

const STEPS = [
  { icon: GraduationCap, title: "Welcome to GradeWise GH", subtitle: "The academic tracker built for Ghanaian students", color: "from-blue-600 to-indigo-700" },
  { icon: Calculator, title: "Track Every Semester", subtitle: "Enter courses & grades — GPA calculated instantly across all 45+ Ghanaian universities", color: "from-indigo-600 to-purple-700" },
  { icon: Target, title: "Set Your CGPA Goal", subtitle: "Input your target, and we'll tell you the exact grades you need each semester", color: "from-purple-600 to-rose-600" },
  { icon: TrendingUp, title: "See Your Progress", subtitle: "Watch your CGPA trend, earn badges, and stay motivated to reach First Class", color: "from-rose-600 to-orange-600" },
  { icon: Award, title: "You've Got This!", subtitle: "GradeWise GH is here with you every semester, every step of the way", color: "from-orange-500 to-amber-500" },
];

const STEP_DURATION = 2600;

interface Props { onDone: () => void; }

export function IntroSplash({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const total = STEPS.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => {
        if (s >= total - 1) { clearInterval(interval); onDone(); return s; }
        return s + 1;
      });
    }, STEP_DURATION);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const raf = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / STEP_DURATION) * 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [step]);

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Animated gradient background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className={`absolute inset-0 bg-gradient-to-br ${current.color}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
      </AnimatePresence>

      {/* Floating decorative circles */}
      <motion.div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/5 blur-2xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/5 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-white/5 blur-xl"
        animate={{ x: [0, 15, 0], y: [0, -30, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-white text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-10 flex items-center gap-3"
        >
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            GradeWise<span className="text-white/70">GH</span>
          </span>
        </motion.div>

        {/* Step icon & content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center max-w-lg"
          >
            <motion.div
              className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl mb-8 shadow-2xl"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, type: "spring", delay: 0.1 }}
            >
              <current.icon className="w-16 h-16 text-white" />
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl font-black leading-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {current.title}
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-white/80 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              {current.subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Step dots */}
        <div className="flex gap-2 mt-10 mb-6">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full bg-white transition-all duration-500 ${i === step ? "w-8 opacity-100" : "w-2 opacity-40"}`}
            />
          ))}
        </div>

        {/* Progress bar for current step */}
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>

        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onDone}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
        >
          {step === total - 1 ? "Get Started" : "Skip intro"}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
