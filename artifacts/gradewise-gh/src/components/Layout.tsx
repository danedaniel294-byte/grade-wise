import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useSignout, useGetCgpaGoal } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Palette, Check, Calculator, Target, LayoutDashboard, Trophy } from "lucide-react";
import { useTheme, ThemePreset } from "@/hooks/use-theme";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { QrShareModal } from "./QrShareModal";
import { PwaInstallBanner } from "./PwaInstallBanner";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const { mutate: signout } = useSignout();
  const queryClient = useQueryClient();
  const { activeTheme, setTheme, presets } = useTheme();
  const { data: goalData } = useGetCgpaGoal();
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  useEffect(() => {
    if (goalData?.targetCgpa && goalData.targetCgpa > 0) {
      const timer = setTimeout(() => setGoalModalOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [goalData?.targetCgpa]);

  const handleSignout = () => {
    signout(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/welcome");
      },
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <PwaInstallBanner />
      {/* Goal Reminder Modal */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-8 text-center shadow-2xl border-primary/20">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="font-display text-xl font-bold mb-2">Eye On The Prize!</DialogTitle>
          <p className="text-muted-foreground text-sm mb-4">
            Your current CGPA goal is
          </p>
          <div className="text-5xl font-display font-extrabold text-primary mb-4">
            {goalData?.targetCgpa?.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mb-6">Keep pushing — every grade counts.</p>
          <Button
            className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20"
            onClick={() => setGoalModalOpen(false)}
          >
            Let's Work!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-x-0 border-t-0 rounded-none shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group outline-none">
              <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <span className="font-display font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                GradeWise<span className="text-primary">GH</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location === "/"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                Calculator
              </Link>
              <Link
                href="/goals"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location === "/goals"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Target className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                Goals & Targets
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <QrShareModal />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-4 rounded-2xl shadow-xl shadow-black/5">
                <h4 className="font-display font-semibold mb-3">Theme Selection</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(presets).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key as ThemePreset)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                        activeTheme === key ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: `hsl(${value.primary})` }}
                    >
                      {activeTheme === key && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Avatar className="w-8 h-8 border border-border/50">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm hidden sm:block">{user.username}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2 rounded-2xl shadow-xl shadow-black/5">
                <div className="p-3 border-b border-border/50 mb-2">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.universityName || "No University Selected"}</p>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                  onClick={handleSignout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
