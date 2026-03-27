import { useState, useMemo, useEffect, useRef } from "react";
import {
  useGetMe,
  useGetUniversities,
  useGetSemesters,
  useSaveSemester,
  useParseTranscript,
  SaveCourseRequest
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, GraduationCap, Award, Calculator, Loader2, BookOpen, ExternalLink, TrendingUp, Scan, Star, Flame, CheckCircle2, Zap, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { AdsterraBanner } from "@/components/AdsterraBanner";

const LEVELS = [100, 200, 300, 400, 500, 600];
const SEMESTERS = [1, 2];

const INFO_TABS = [
  {
    id: "about",
    label: "About",
    content:
      "GradeWise GH is a dedicated academic tracking portal built specifically for Ghanaian university students. Enter your courses and grades each semester, and the system automatically calculates your GPA and CGPA using your institution's official grading scale. Supports 45+ Ghanaian universities.",
  },
  {
    id: "privacy",
    label: "Privacy",
    content:
      "Your grades and personal data are stored securely on our server and are tied to your username session only. We do not collect, sell, or share your academic information with any third party. Your data is yours.",
  },
  {
    id: "terms",
    label: "Terms",
    content:
      "GradeWise GH is a student productivity tool and is not affiliated with any Ghanaian university. Always verify your official grades on your institution's student portal. Results here are for planning purposes only.",
  },
  {
    id: "pricing",
    label: "Pricing",
    content:
      "GradeWise GH is completely free for all students. We are supported by non-intrusive ads and the generosity of the student community. Premium features and tools may be introduced in the future.",
  },
];

export default function Dashboard() {
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: universities } = useGetUniversities();
  const { data: semesters, isLoading: loadingSemesters, refetch: refetchSemesters } = useGetSemesters();
  const { mutate: saveSemester, isPending: saving } = useSaveSemester();
  const { mutate: parseTranscript, isPending: parsing } = useParseTranscript();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeLevel, setActiveLevel] = useState(100);
  const [activeSemester, setActiveSemester] = useState(1);
  const [localCourses, setLocalCourses] = useState<SaveCourseRequest[]>([]);
  const [activeTab, setActiveTab] = useState("about");

  const university = useMemo(() => {
    if (!universities || !user?.universityId) return null;
    return universities.find(u => u.id === user.universityId);
  }, [universities, user]);

  const gradingScale = university?.gradingScale || [];

  useEffect(() => {
    if (!semesters) return;
    const existing = semesters.find(s => s.level === activeLevel && s.semesterNumber === activeSemester);
    if (existing && existing.courses.length > 0) {
      setLocalCourses(existing.courses.map(c => ({
        name: c.name,
        creditHours: c.creditHours,
        grade: c.grade,
        score: c.score
      })));
    } else {
      setLocalCourses([
        { name: "", creditHours: 3, grade: null, score: null },
        { name: "", creditHours: 3, grade: null, score: null },
        { name: "", creditHours: 3, grade: null, score: null },
      ]);
    }
  }, [semesters, activeLevel, activeSemester]);

  const addCourse = () => {
    setLocalCourses([...localCourses, { name: "", creditHours: 3, grade: null, score: null }]);
  };

  const removeCourse = (index: number) => {
    setLocalCourses(localCourses.filter((_, i) => i !== index));
  };

  const updateCourse = (index: number, field: keyof SaveCourseRequest, value: any) => {
    const updated = [...localCourses];
    updated[index] = { ...updated[index], [field]: value };
    setLocalCourses(updated);
  };

  const getPointsForGrade = (grade: string | null) => {
    if (!grade) return 0;
    const scale = gradingScale.find(g => g.grade === grade);
    return scale ? scale.points : 0;
  };

  const calculateGpa = (courses: SaveCourseRequest[]) => {
    let totalCredits = 0;
    let totalPoints = 0;
    courses.forEach(c => {
      if (c.grade && c.creditHours > 0) {
        totalCredits += c.creditHours;
        totalPoints += (getPointsForGrade(c.grade) * c.creditHours);
      }
    });
    return totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  };

  const currentGpa = useMemo(() => calculateGpa(localCourses), [localCourses, gradingScale]);

  const calculateCgpa = () => {
    let totalCredits = 0;
    let totalPoints = 0;
    semesters?.forEach(s => {
      if (s.level === activeLevel && s.semesterNumber === activeSemester) return;
      s.courses.forEach(c => {
        if (c.grade && c.creditHours > 0) {
          totalCredits += c.creditHours;
          totalPoints += (getPointsForGrade(c.grade) * c.creditHours);
        }
      });
    });
    localCourses.forEach(c => {
      if (c.grade && c.creditHours > 0) {
        totalCredits += c.creditHours;
        totalPoints += (getPointsForGrade(c.grade) * c.creditHours);
      }
    });
    return totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  };

  const currentCgpa = useMemo(() => calculateCgpa(), [localCourses, semesters, activeLevel, activeSemester, gradingScale]);

  const getClassification = (cgpa: number) => {
    if (!university || cgpa === 0) return "Not Available";
    if (cgpa >= university.firstClass) return "First Class Honours";
    if (cgpa >= university.secondClassUpper) return "Second Class (Upper Division)";
    if (cgpa >= university.secondClassLower) return "Second Class (Lower Division)";
    if (cgpa >= university.thirdClass) return "Third Class";
    if (cgpa >= university.pass) return "Pass";
    return "Fail";
  };

  // Build cumulative CGPA progress chart data from all saved semesters
  const chartData = useMemo(() => {
    if (!semesters) return [];
    let totalCredits = 0;
    let totalPoints = 0;
    const points: { label: string; cgpa: number }[] = [];

    for (let l = 100; l <= 600; l += 100) {
      for (let s = 1; s <= 2; s++) {
        const sem = semesters.find(x => x.level === l && x.semesterNumber === s);
        if (!sem || sem.courses.length === 0) continue;
        sem.courses.forEach(c => {
          if (c.grade && c.creditHours > 0) {
            totalCredits += c.creditHours;
            totalPoints += getPointsForGrade(c.grade) * c.creditHours;
          }
        });
        if (totalCredits > 0) {
          points.push({ label: `L${l}S${s}`, cgpa: parseFloat((totalPoints / totalCredits).toFixed(2)) });
        }
      }
    }
    return points;
  }, [semesters, gradingScale]);

  const handleUploadTranscript = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file (JPEG, PNG, etc.)", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      parseTranscript(
        { data: { imageBase64: base64, mimeType: file.type } },
        {
          onSuccess: (data) => {
            if (data.error) {
              toast({ title: "Parsing error", description: data.error, variant: "destructive" });
              return;
            }
            if (data.courses.length === 0) {
              toast({ title: "No courses found", description: "The AI couldn't find any graded courses. Try a clearer image.", variant: "destructive" });
              return;
            }
            const mapped: SaveCourseRequest[] = data.courses.map(c => ({
              name: c.name,
              creditHours: c.creditHours,
              grade: c.grade ?? null,
              score: null,
            }));
            setLocalCourses(mapped);
            toast({ title: `${data.courses.length} courses imported!`, description: "Review and save your transcript results." });
          },
          onError: (err: any) => {
            toast({ title: "Upload failed", description: err?.error?.error ?? "Failed to parse transcript.", variant: "destructive" });
          },
        }
      );
    };
    reader.readAsDataURL(file);
    // reset so same file can be re-uploaded
    e.target.value = "";
  };

  const handleSave = () => {
    const validCourses = localCourses.filter(c => c.name.trim() !== "");
    if (validCourses.length === 0) {
      toast({ title: "No valid courses", description: "Please enter at least one course with a name.", variant: "destructive" });
      return;
    }
    saveSemester(
      { data: { level: activeLevel, semesterNumber: activeSemester, courses: validCourses } },
      {
        onSuccess: () => {
          toast({ title: "Semester Saved", description: "Your grades have been updated successfully." });
          refetchSemesters();
        },
        onError: () => {
          toast({ title: "Failed to save", variant: "destructive" });
        }
      }
    );
  };

  if (loadingSemesters || !university) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstClassThreshold = university.firstClass;

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            {university.name} • {university.gradingSystem} System
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-card border border-border/60 shadow-sm rounded-2xl p-4 flex flex-col justify-center min-w-[140px]">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Active GPA</span>
            <span className="text-3xl font-display font-bold text-primary">{currentGpa.toFixed(2)}</span>
          </div>
          <div className="bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 rounded-2xl p-4 flex flex-col justify-center min-w-[160px] text-primary-foreground relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Award className="w-24 h-24" />
            </div>
            <span className="text-xs font-medium text-primary-foreground/80 uppercase tracking-wider mb-1 relative z-10">Current CGPA</span>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-display font-bold">{currentCgpa.toFixed(2)}</span>
            </div>
            <div className="mt-1 text-xs font-medium bg-white/20 inline-block px-2 py-0.5 rounded-full w-max backdrop-blur-sm relative z-10">
              {getClassification(currentCgpa)}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Badges Row */}
      {(() => {
        const semCount = semesters?.length ?? 0;
        const cgpa = currentCgpa;
        const compactBadges = [
          { label: "Getting Started", icon: Star, earned: true, color: "text-amber-500" },
          { label: "Data Pioneer", icon: BookOpen, earned: semCount >= 1, color: "text-blue-500" },
          { label: "Consistent", icon: Flame, earned: semCount >= 3, color: "text-orange-500" },
          { label: "Scholar", icon: Award, earned: cgpa >= 3.0, color: "text-purple-500" },
          { label: "High Achiever", icon: Zap, earned: cgpa >= 3.5, color: "text-indigo-500" },
          { label: "First Class", icon: CheckCircle2, earned: cgpa >= (university?.firstClass ?? 3.6), color: "text-emerald-500" },
        ];
        const earnedBadges = compactBadges.filter(b => b.earned);
        return (
          <div className="flex flex-wrap gap-2">
            {compactBadges.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: b.earned ? 1 : 0.35, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                  ${b.earned ? `${b.color} bg-white/5 border-current/20` : "text-muted-foreground border-border/40 grayscale"}`}
                title={b.earned ? `${b.label} — Earned!` : `${b.label} — Not yet earned`}
              >
                <b.icon className="w-3.5 h-3.5" />
                {b.label}
                {b.earned && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
              </motion.div>
            ))}
            <a href="#/goals" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 text-xs font-medium text-primary hover:bg-primary/10 transition-all">
              <Target className="w-3.5 h-3.5" />
              {earnedBadges.length}/{compactBadges.length} — See All
            </a>
          </div>
        );
      })()}

      {/* Level / Semester Selectors */}
      <div className="bg-card border border-border/60 shadow-sm rounded-2xl p-2 flex flex-col md:flex-row gap-2">
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex-1">
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeLevel === level
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              Level {level}
            </button>
          ))}
        </div>
        <div className="w-px bg-border hidden md:block mx-1" />
        <div className="flex gap-1">
          {SEMESTERS.map(sem => (
            <button
              key={sem}
              onClick={() => setActiveSemester(sem)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 md:flex-none ${
                activeSemester === sem
                  ? "bg-secondary text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      </div>

      {/* Course Table */}
      <Card className="rounded-3xl border-border/60 shadow-lg shadow-black/5 overflow-hidden">
        <CardHeader className="bg-secondary/30 border-b border-border/40 px-6 py-5 flex flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="font-display text-xl">Level {activeLevel}, Sem {activeSemester}</CardTitle>
            <CardDescription>Enter your courses and grades to calculate GPA.</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadTranscript}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="rounded-xl gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary text-muted-foreground"
            >
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {parsing ? "Parsing..." : "AI Import"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Semester
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Course Code/Name</th>
                  <th className="px-6 py-4 font-medium w-32">Credits</th>
                  <th className="px-6 py-4 font-medium w-40">Grade</th>
                  <th className="px-6 py-4 font-medium w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {localCourses.map((course, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-6 py-3">
                        <Input
                          value={course.name}
                          onChange={(e) => updateCourse(index, "name", e.target.value)}
                          placeholder="e.g. MATH 101"
                          className="h-10 rounded-lg bg-transparent border-transparent hover:border-border focus:bg-background transition-all"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <Input
                          type="number"
                          min="1"
                          max="6"
                          value={course.creditHours}
                          onChange={(e) => updateCourse(index, "creditHours", parseInt(e.target.value) || 0)}
                          className="h-10 rounded-lg bg-transparent border-transparent hover:border-border focus:bg-background transition-all"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <Select
                          value={course.grade || undefined}
                          onValueChange={(val) => updateCourse(index, "grade", val)}
                        >
                          <SelectTrigger className="h-10 rounded-lg bg-transparent border-transparent hover:border-border focus:bg-background transition-all">
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {gradingScale.map((g) => (
                              <SelectItem key={g.grade} value={g.grade} className="rounded-lg">
                                {g.grade} ({g.points.toFixed(1)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCourse(index)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border/40 bg-secondary/10 flex justify-center">
            <Button
              variant="outline"
              onClick={addCourse}
              className="rounded-xl border-dashed border-2 hover:bg-secondary hover:text-foreground text-muted-foreground bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CGPA Progress Chart */}
      {chartData.length >= 2 && (
        <Card className="rounded-3xl border-border/60 shadow-lg shadow-black/5 overflow-hidden">
          <CardHeader className="bg-secondary/30 border-b border-border/40 px-6 py-5">
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              CGPA Progress
            </CardTitle>
            <CardDescription>Your cumulative GPA trend across all semesters.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, firstClassThreshold > 4 ? 5 : 4]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickCount={5}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(val: number) => [val.toFixed(2), "CGPA"]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }} />
                <ReferenceLine
                  y={firstClassThreshold}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: "1st Class",
                    fill: "hsl(var(--primary))",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cgpa"
                  name="CGPA"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Support the Project (Adsterra Affiliate) */}
      <Card className="rounded-3xl border-dashed border-2 border-primary/30 bg-primary/5 shadow-none">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Support the Project</p>
            <p className="text-sm text-muted-foreground">Keep GradeWise GH free by checking out our sponsor.</p>
          </div>
          <a
            href="https://www.profitablecpmratenetwork.com/e5166h37t?key=cfc0da1e7cac2416bb88c507a1094a85"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="rounded-xl gap-2 shrink-0 border-primary/30 hover:bg-primary/10 hover:text-primary">
              <BookOpen className="w-4 h-4" />
              Unlock Study Resources
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Info Tabs: About / Privacy / Terms / Pricing */}
      <Card className="rounded-3xl border-border/60 shadow-lg shadow-black/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex gap-1 border-b border-border/50 mb-5 overflow-x-auto hide-scrollbar">
            {INFO_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {INFO_TABS.filter(t => t.id === activeTab).map(tab => (
              <motion.p
                key={tab.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {tab.content}
              </motion.p>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Adsterra Banner Ad */}
      <AdsterraBanner />

      {/* Footer: copyright + visit counter */}
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-xs text-muted-foreground">© 2026 GradeWise GH. All rights reserved.</p>
        <img
          src="https://count.getloli.com/get/@gradewisegh-final-v1?theme=asoul"
          alt="Site visits"
          className="h-5 opacity-70 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
}
