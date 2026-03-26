import { useState } from "react";
import { useLocation } from "wouter";
import { useSignup, useSignin, useGetUniversities, useSaveUserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [universityId, setUniversityId] = useState<string>("");

  const { data: universities, isLoading: loadingUnis } = useGetUniversities();
  const { mutate: signin, isPending: isSigninPending } = useSignin();
  const { mutate: signup, isPending: isSignupPending } = useSignup();
  const { mutateAsync: saveProfile } = useSaveUserProfile();

  const isPending = isSigninPending || isSignupPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: "Username required", variant: "destructive" });
      return;
    }

    if (isLogin) {
      signin(
        { data: { username } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            setLocation("/");
          },
          onError: (err) => {
            toast({ 
              title: "Sign in failed", 
              description: err.error?.error || "User not found. Try signing up instead.",
              variant: "destructive" 
            });
          }
        }
      );
    } else {
      if (!universityId) {
        toast({ title: "Please select a university", variant: "destructive" });
        return;
      }
      signup(
        { data: { username } },
        {
          onSuccess: async () => {
            await saveProfile({ data: { universityId: parseInt(universityId, 10) } });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            setLocation("/");
          },
          onError: (err) => {
            toast({ 
              title: "Sign up failed", 
              description: err.error?.error || "Username might be taken.",
              variant: "destructive" 
            });
          }
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
            Take control of your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Academic Journey</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            GradeWise GH is the ultimate GPA & CGPA calculator tailored specifically for Ghanaian university grading systems.
          </p>
          
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
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
            <h2 className="text-3xl font-display font-bold mb-2">Welcome to GradeWise</h2>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to access your dashboard" : "Create an account to track your grades"}
            </p>
          </div>

          <div className="bg-card border border-border/50 shadow-2xl shadow-primary/5 rounded-3xl p-8">
            <div className="flex p-1 bg-secondary rounded-xl mb-8">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  !isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground ml-1">
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
                    <label htmlFor="university" className="text-sm font-medium text-foreground ml-1">
                      University
                    </label>
                    <Select disabled={loadingUnis || isPending} value={universityId} onValueChange={setUniversityId}>
                      <SelectTrigger className="h-12 rounded-xl bg-background border-border/60 focus:ring-primary/20">
                        <SelectValue placeholder={loadingUnis ? "Loading..." : "Select your university"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {universities?.map((uni) => (
                          <SelectItem key={uni.id} value={uni.id.toString()} className="rounded-lg">
                            {uni.name} ({uni.shortName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
