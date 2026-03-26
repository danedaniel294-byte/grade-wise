import { useState } from "react";
import { useGetCgpaGoal, useSaveCgpaGoal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Goals() {
  const { toast } = useToast();
  const { data: goalData, isLoading, refetch } = useGetCgpaGoal();
  const { mutate: saveGoal, isPending } = useSaveCgpaGoal();

  const [targetCgpa, setTargetCgpa] = useState<string>(goalData?.targetCgpa?.toString() || "");
  const [remainingCredits, setRemainingCredits] = useState<string>(goalData?.remainingCredits?.toString() || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetCgpa);
    const credits = parseInt(remainingCredits);

    if (isNaN(target) || isNaN(credits) || credits <= 0 || target <= 0) {
      toast({ title: "Invalid input", description: "Please enter valid numbers.", variant: "destructive" });
      return;
    }

    saveGoal(
      { data: { targetCgpa: target, remainingCredits: credits } },
      {
        onSuccess: () => {
          toast({ title: "Goal Updated", description: "Your target has been calculated." });
          refetch();
        },
        onError: (err) => {
          toast({ title: "Failed to update", description: err.error?.error, variant: "destructive" });
        }
      }
    );
  };

  const getLikelihoodColor = (likelihood: string | null | undefined) => {
    switch (likelihood) {
      case "very_high": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "high": return "text-green-500 bg-green-500/10 border-green-500/20";
      case "moderate": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "very_low": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getLikelihoodLabel = (likelihood: string | null | undefined) => {
    if (!likelihood) return "Unknown";
    return likelihood.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Target Simulator</h1>
        <p className="text-muted-foreground mt-1">Set a goal and see exactly what it takes to reach it.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form Card */}
        <Card className="rounded-3xl border-border/60 shadow-lg shadow-black/5 overflow-hidden h-fit">
          <CardHeader className="bg-secondary/30 border-b border-border/40 px-6 py-5">
            <CardTitle className="font-display flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Set Your Goal
            </CardTitle>
            <CardDescription>Enter your desired CGPA and remaining credits.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Target CGPA</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(e.target.value)}
                  placeholder="e.g. 3.60"
                  className="h-12 rounded-xl bg-background border-border/60 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Remaining Credit Hours to Graduate</label>
                <Input
                  type="number"
                  min="1"
                  value={remainingCredits}
                  onChange={(e) => setRemainingCredits(e.target.value)}
                  placeholder="e.g. 36"
                  className="h-12 rounded-xl bg-background border-border/60 focus:ring-primary/20"
                />
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Calculate Requirements"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="rounded-3xl border-border/60 shadow-lg shadow-black/5 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/40 px-6 py-5">
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Analysis
            </CardTitle>
            <CardDescription>What you need to do to achieve your goal.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {!goalData?.requiredGpa ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mb-4 opacity-20" />
                <p>Calculate your target to see the required GPA per semester.</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="text-center p-6 bg-secondary/50 rounded-2xl border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-widest">Required Avg. GPA</p>
                  <div className="text-5xl font-display font-extrabold text-foreground mb-2">
                    {goalData.requiredGpa > 4.0 ? "Impossible" : goalData.requiredGpa.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">in your remaining {goalData.remainingCredits} credits</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span>Feasibility</span>
                      <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${getLikelihoodColor(goalData.likelihood)}`}>
                        {getLikelihoodLabel(goalData.likelihood)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-xl p-4 flex gap-3 text-sm border border-primary/10">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground leading-relaxed">
                      {goalData.requiredGpa > 4.0 ? (
                        "Mathematically impossible to reach this target with your remaining credits. Consider lowering your goal or taking more credits if permitted."
                      ) : goalData.likelihood === "very_high" || goalData.likelihood === "high" ? (
                        "You are on track! Maintain your current study habits and this goal is well within reach."
                      ) : (
                        "This will require significant improvement. Focus on maximizing your grades in high-credit courses."
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
