import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useSignup, useSignin, useGetUniversities, useSaveUserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, ArrowRight, Loader2, Search, Check, ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [universityId, setUniversityId] = useState<string>("");
  const [uniSearch, setUniSearch] = useState("");
  const [uniOpen, setUniOpen] = useState(false);

  const { data: universities, isLoading: loadingUnis } = useGetUniversities();
  const { mutate: signin, isPending: isSigninPending } = useSignin();
  const { mutate: signup, isPending: isSignupPending } = useSignup();
  const { mutateAsync: saveProfile } = useSaveUserProfile();

  const isPending = isSigninPending || isSignupPending;

  const filteredUniversities = useMemo(() => {
    if (!universities) return [];
    const q = uniSearch.toLowerCase().trim();
    if (!q) return universities;
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q)
    );
  }, [universities, uniSearch]);

  const selectedUni = universities?.find((u) => u.id.toString() === universityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: "Username required", variant: "destructive" });
      return;
    }

    if (isLogin) {
      signin(
        { data: { username: username.trim() } },
        {
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            setLocation("/");
          },
          onError: (err: any) => {
            toast({
              title: "Sign in failed",
              description: err?.data?.error || "Username not found. Please sign up first.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      if (!universityId) {
        toast({ title: "Please select your university", variant: "destructive" });
        return;
      }
      signup(
        { data: { username: username.trim() } },
        {
          onSuccess: async () => {
            try {
              await saveProfile({ data: { universityId: parseInt(universityId, 10) } });
            } catch {
              // Profile can be updated on the dashboard
            }
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            setLocation("/");
          },
          onError: (err: any) => {
            toast({
              title: "Sign up failed",
              description: err?.data?.error || "Username might already be taken. Try signing in instead.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background selection:bg-primary/20">
      {/* Left side - Decorative/Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-primary/5 items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Abstract academic background"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-xl p-12">
          <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl inline-block mb-6 border border-white/20 shadow-2xl">
            <Calculator className="w-12 h-12 text-primary drop-shadow-md" />
          </div>
          <h1 className="text-6xl font-display font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            Take control of your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Academic Journey
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            GradeWise GH is the ultimate GPA & CGPA calculator tailored
            specifically for Ghanaian university grading systems.
          </p>

          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-secondary-foreground font-bold"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Join thousands of students aiming for First Class
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex lg:hidden bg-primary/10 p-3 rounded-2xl mb-6">
              <Calculator className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">
              Welcome to GradeWise
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to access your dashboard"
                : "Create an account to track your grades"}
            </p>
          </div>

          <div className="bg-card border border-border/50 shadow-2xl shadow-primary/5 rounded-3xl p-8">
            <div className="flex p-1 bg-secondary rounded-xl mb-8">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  isLogin
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  !isLogin
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-foreground ml-1"
                >
                  Username
                </label>
                <Input
                  id="username"
                  placeholder="Enter a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 rounded-xl bg-background border-border/60 focus:ring-primary/20"
                  disabled={isPending}
                />
              </div>

              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-sm font-medium text-foreground ml-1">
                      University
                    </label>
                    <Popover open={uniOpen} onOpenChange={setUniOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={loadingUnis || isPending}
                          className={cn(
                            "w-full h-12 rounded-xl bg-background border border-border/60 px-3 flex items-center justify-between text-sm transition-colors",
                            "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                            !selectedUni && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                            {loadingUnis
                              ? "Loading universities..."
                              : selectedUni
                              ? `${selectedUni.name} (${selectedUni.shortName})`
                              : "Search and select your university"}
                          </span>
                          <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] p-0 rounded-xl shadow-xl" align="start" side="bottom">
                        <div className="p-3 border-b border-border/50">
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50">
                            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                            <input
                              autoFocus
                              placeholder="Search university..."
                              value={uniSearch}
                              onChange={(e) => setUniSearch(e.target.value)}
                              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                          </div>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto p-1.5">
                          {filteredUniversities.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No university found
                            </div>
                          ) : (
                            filteredUniversities.map((uni) => (
                              <button
                                key={uni.id}
                                type="button"
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                                  "hover:bg-primary/10 hover:text-primary",
                                  universityId === uni.id.toString() && "bg-primary/10 text-primary font-medium"
                                )}
                                onClick={() => {
                                  setUniversityId(uni.id.toString());
                                  setUniSearch("");
                                  setUniOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "w-4 h-4 shrink-0",
                                    universityId === uni.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>
                                  <span className="font-medium">{uni.shortName}</span>
                                  {" — "}
                                  <span className="text-muted-foreground">{uni.name}</span>
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 mt-4"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
