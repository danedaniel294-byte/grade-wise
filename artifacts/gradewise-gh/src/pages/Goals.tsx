import { useState, useEffect } from "react";
import { useGetCgpaGoal, useSaveCgpaGoal, useGetSemesters, useGetMe, useGetUniversities } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, TrendingUp, Info, Loader2, Award, Star, Flame, CheckCircle2, BookOpen, Bell, BellOff, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ── Badge definitions ────────────────────────────────────────────────────────

interface Badge { id: string; label: string; desc: string; icon: React.ElementType; color: string; earned: boolean; }

function computeBadges(params: {
  semesterCount: number;
  currentCgpa: number;
  targetCgpa: number | null;
  firstClassThreshold: number;
}): Badge[] {
  const { semesterCount, currentCgpa, targetCgpa, firstClassThreshold } = params;
  return [
    {
      id: "getting_started",
      label: "Getting Started",
      desc: "Created your GradeWise GH account",
      icon: Star,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      earned: true,
    },
    {
      id: "data_pioneer",
      label: "Data Pioneer",
      desc: "Saved your first semester of grades",
      icon: BookOpen,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      earned: semesterCount >= 1,
    },
    {
      id: "consistent",
      label: "Consistent",
      desc: "Saved 3 or more semesters",
      icon: Flame,
      color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
      earned: semesterCount >= 3,
    },
    {
      id: "scholar",
      label: "Scholar",
      desc: "Achieved a CGPA of 3.0 or above",
      icon: Award,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      earned: currentCgpa >= 3.0,
    },
    {
      id: "high_achiever",
      label: "High Achiever",
      desc: "Achieved a CGPA of 3.5 or above",
      icon: Zap,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      earned: currentCgpa >= 3.5,
    },
    {
      id: "first_class_aspirant",
      label: "First Class Aspirant",
      desc: `Reached the First Class threshold (${firstClassThreshold.toFixed(2)}+)`,
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      earned: currentCgpa >= firstClassThreshold,
    },
    {
      id: "goal_setter",
      label: "Goal Setter",
      desc: "Set a target CGPA to work toward",
      icon: Target,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      earned: targetCgpa !== null && targetCgpa > 0,
    },
    {
      id: "achiever",
      label: "Goal Achieved!",
      desc: "Your current CGPA meets or exceeds your target",
      icon: TrendingUp,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
      earned: targetCgpa !== null && targetCgpa > 0 && currentCgpa >= targetCgpa,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────

const LIKELIHOOD_CONFIG: Record<string, { label: string; color: string; bar: string; pct: number }> = {
  very_high: { label: "Very High",  color: "text-emerald-500", bar: "bg-emerald-500", pct: 95 },
  high:      { label: "High",       color: "text-green-500",   bar: "bg-green-500",   pct: 78 },
  moderate:  { label: "Moderate",   color: "text-yellow-500",  bar: "bg-yellow-500",  pct: 55 },
  low:       { label: "Low",        color: "text-orange-500",  bar: "bg-orange-500",  pct: 32 },
  very_low:  { label: "Very Low",   color: "text-red-500",     bar: "bg-red-500",     pct: 12 },
};

export default function Goals() {
  const { toast } = useToast();
  const { data: goalData, isLoading, refetch } = useGetCgpaGoal();
  const { mutate: saveGoal, isPending } = useSaveCgpaGoal();
  const { data: semesters } = useGetSemesters();
  const { data: user } = useGetMe();
  const { data: universities } = useGetUniversities();
  const [remindersOn, setRemindersOn] = useState(false);

  const [targetCgpa, setTargetCgpa] = useState("");
  const [remainingCredits, setRemainingCredits] = useState("");
  const [remainingSemesters, setRemainingSemesters] = useState("");
  const [coursesPerSemester, setCoursesPerSemester] = useState("");
  const [activeTab, setActiveTab] = useState<"plan" | "badges">("plan");

  useEffect(() => {
    if (goalData) {
      if (goalData.targetCgpa) setTargetCgpa(goalData.targetCgpa.toString());
      if (goalData.remainingCredits) setRemainingCredits(goalData.remainingCredits.toString());
      if (goalData.remainingSemesters) setRemainingSemesters(goalData.remainingSemesters.toString());
      if (goalData.coursesPerSemester) setCoursesPerSemester(goalData.coursesPerSemester.toString());
    }
  }, [goalData]);

  const university = universities?.find((u) => u.id === user?.universityId);
  const firstClassThreshold = university?.firstClass ?? 3.6;
  const semesterCount = semesters?.length ?? 0;
  const currentCgpa = goalData?.currentCgpa ?? 0;
  const target = goalData?.targetCgpa ?? null;

  const badges = computeBadges({ semesterCount, currentCgpa, targetCgpa: target, firstClassThreshold });
  const earnedCount = badges.filter((b) => b.earned).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const tgt = parseFloat(targetCgpa);
    const cred = parseInt(remainingCredits);
    const sems = remainingSemesters ? parseInt(remainingSemesters) : undefined;
    const cps = coursesPerSemester ? parseInt(coursesPerSemester) : undefined;

    if (isNaN(tgt) || isNaN(cred) || cred <= 0 || tgt <= 0) {
      toast({ title: "Invalid input", description: "Please enter valid numbers.", variant: "destructive" });
      return;
    }

    saveGoal(
      { data: { targetCgpa: tgt, remainingCredits: cred, remainingSemesters: sems ?? null, coursesPerSemester: cps ?? null } },
      {
        onSuccess: () => {
          toast({ title: "Goal Updated", description: "Your target plan has been calculated." });
          refetch();
        },
        onError: (err: any) => {
          toast({ title: "Failed to update", description: err?.error?.error ?? "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const likeCfg = goalData?.likelihood ? LIKELIHOOD_CONFIG[goalData.likelihood] : null;
  const progressPct = goalData?.progressPercentage ?? 0;
  const requiredGpa = goalData?.requiredGpa ?? null;
  const semesterPlans = goalData?.semesterPlans ?? null;

  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Goal Planner</h1>
          <p className="text-muted-foreground mt-1">Set your target and get a semester-by-semester roadmap.</p>
        </div>
        <button
          onClick={() => {
            setRemindersOn(!remindersOn);
            toast({ title: remindersOn ? "Reminders off" : "Reminders on", description: remindersOn ? "You won't be reminded about your goal." : "We'll remind you of your goal when you visit." });
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${remindersOn ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
        >
          {remindersOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {remindersOn ? "Reminders On" : "Reminders Off"}
        </button>
      </div>

      {/* Current CGPA + Progress toward goal */}
      {currentCgpa > 0 && (
        <Card className="rounded-3xl border-border/60 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Current CGPA</p>
                <div className="text-5xl font-display font-extrabold text-primary">{currentCgpa.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">{goalData?.classification ?? "—"}</p>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-muted-foreground">Progress toward goal</span>
                  <span className="text-primary font-bold">{target ? `${progressPct}%` : "No goal set"}</span>
                </div>
                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.00</span>
                  {target && <span className="text-primary font-semibold">Target: {target.toFixed(2)}</span>}
                  <span>{firstClassThreshold.toFixed(2)} (1st Class)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-2xl p-1">
        {(["plan", "badges"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "badges" ? `🏅 Badges (${earnedCount}/${badges.length})` : "📋 Goal Planner"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "plan" && (
          <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Form */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-border/60 shadow-lg overflow-hidden h-fit">
                <CardHeader className="bg-secondary/30 border-b border-border/40 px-6 py-5">
                  <CardTitle className="font-display flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> Set Your Goal
                  </CardTitle>
                  <CardDescription>Fill in your target and remaining semesters for a personalised plan.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium ml-1">Target CGPA / CWA</label>
                      <Input type="number" step="0.01" min="0" max="100" value={targetCgpa} onChange={(e) => setTargetCgpa(e.target.value)} placeholder="e.g. 3.60" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium ml-1">Remaining Credit Hours</label>
                      <Input type="number" min="1" value={remainingCredits} onChange={(e) => setRemainingCredits(e.target.value)} placeholder="e.g. 60" className="h-11 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium ml-1">Remaining Semesters</label>
                        <Input type="number" min="1" max="12" value={remainingSemesters} onChange={(e) => setRemainingSemesters(e.target.value)} placeholder="e.g. 4" className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium ml-1">Courses per Semester</label>
                        <Input type="number" min="1" max="15" value={coursesPerSemester} onChange={(e) => setCoursesPerSemester(e.target.value)} placeholder="e.g. 5" className="h-11 rounded-xl" />
                      </div>
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20 mt-2">
                      {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Calculate My Roadmap"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Analysis results */}
              <Card className="rounded-3xl border-border/60 shadow-lg overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-border/40 px-6 py-5">
                  <CardTitle className="font-display flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Analysis
                  </CardTitle>
                  <CardDescription>What you need each semester to hit your goal.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {!requiredGpa ? (
                    <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mb-4 opacity-20" />
                      <p>Fill in your goal details and click Calculate.</p>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
                      <div className="text-center p-5 bg-secondary/50 rounded-2xl border border-border/50">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Required GPA Per Semester</p>
                        <div className="text-5xl font-display font-extrabold text-foreground">
                          {requiredGpa > (university?.firstClass ?? 4) ? "Impossible" : requiredGpa.toFixed(2)}
                        </div>
                        {goalData?.remainingSemesters && (
                          <p className="text-sm text-muted-foreground mt-1">over {goalData.remainingSemesters} remaining {goalData.remainingSemesters === 1 ? "semester" : "semesters"}</p>
                        )}
                      </div>

                      {/* Likelihood meter */}
                      {likeCfg && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Feasibility</span>
                            <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${
                              goalData?.likelihood === "very_high" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
                              goalData?.likelihood === "high" ? "text-green-500 bg-green-500/10 border-green-500/20" :
                              goalData?.likelihood === "moderate" ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" :
                              goalData?.likelihood === "low" ? "text-orange-500 bg-orange-500/10 border-orange-500/20" :
                              "text-red-500 bg-red-500/10 border-red-500/20"
                            }`}>
                              {likeCfg.label}
                            </span>
                          </div>
                          <div className="h-3 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${likeCfg.bar} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: `${likeCfg.pct}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="bg-primary/5 rounded-xl p-4 flex gap-3 text-sm border border-primary/10">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-muted-foreground leading-relaxed">
                          {requiredGpa > (university?.firstClass ?? 4) ?
                            "Mathematically impossible with your remaining credits. Consider lowering your goal or negotiating extra credits." :
                            goalData?.likelihood === "very_high" || goalData?.likelihood === "high" ?
                            "You're on track! Maintain your current study habits — this goal is well within reach." :
                            "This will require significant improvement. Focus on maximising grades in high-credit courses."
                          }
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Semester-by-semester plan */}
            {semesterPlans && semesterPlans.length > 0 && (
              <Card className="rounded-3xl border-border/60 shadow-lg overflow-hidden">
                <CardHeader className="bg-secondary/30 border-b border-border/40 px-6 py-5">
                  <CardTitle className="font-display text-xl">Your Semester Roadmap</CardTitle>
                  <CardDescription>Recommended grades for each course in each remaining semester to reach your target.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    {semesterPlans.map((plan, si) => (
                      <div key={si} className={`${si < semesterPlans.length - 1 ? "border-b border-border/40" : ""}`}>
                        <div className="flex items-center gap-3 px-6 py-4 bg-secondary/20">
                          <div className="bg-primary/10 text-primary font-bold text-xs rounded-full w-8 h-8 flex items-center justify-center">
                            {si + 1}
                          </div>
                          <div>
                            <span className="font-semibold text-sm">{plan.semesterLabel}</span>
                            <span className="ml-3 text-xs text-muted-foreground">Target GPA: <strong className="text-primary">{plan.requiredGpa.toFixed(2)}</strong></span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-6 py-4">
                          {plan.courseRecommendations.map((rec, ci) => (
                            <motion.div
                              key={ci}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: ci * 0.05 }}
                              className="flex flex-col items-center justify-center p-3 bg-card border border-border/60 rounded-2xl text-center"
                            >
                              <span className="text-xs text-muted-foreground mb-1">Course {rec.courseNumber}</span>
                              <span className="text-2xl font-display font-extrabold text-primary">{rec.recommendedGrade}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">{rec.points.toFixed(1)} pts</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === "badges" && (
          <motion.div key="badges" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="rounded-3xl border-border/60 shadow-lg overflow-hidden">
              <CardHeader className="bg-secondary/30 border-b border-border/40 px-6 py-5">
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Achievement Badges
                </CardTitle>
                <CardDescription>
                  You've earned <strong className="text-foreground">{earnedCount}</strong> of <strong className="text-foreground">{badges.length}</strong> badges. Keep pushing!
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {badges.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                        badge.earned
                          ? `${badge.color} shadow-sm`
                          : "border-border/40 bg-secondary/20 opacity-50 grayscale"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${badge.earned ? badge.color : "bg-muted text-muted-foreground"} border shrink-0`}>
                        <badge.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight">{badge.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{badge.desc}</p>
                        {badge.earned && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Earned
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
