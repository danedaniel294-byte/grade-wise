import { useState, useMemo, useEffect } from "react";
import { 
  useGetMe, 
  useGetUniversities, 
  useGetSemesters, 
  useSaveSemester,
  SaveCourseRequest
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, GraduationCap, Award, Calculator, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const LEVELS = [100, 200, 300, 400, 500, 600];
const SEMESTERS = [1, 2];

export default function Dashboard() {
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: universities } = useGetUniversities();
  const { data: semesters, isLoading: loadingSemesters, refetch: refetchSemesters } = useGetSemesters();
  const { mutate: saveSemester, isPending: saving } = useSaveSemester();

  const [activeLevel, setActiveLevel] = useState(100);
  const [activeSemester, setActiveSemester] = useState(1);
  const [localCourses, setLocalCourses] = useState<SaveCourseRequest[]>([]);

  // Find user's university to get grading scale
  const university = useMemo(() => {
    if (!universities || !user?.universityId) return null;
    return universities.find(u => u.id === user.universityId);
  }, [universities, user]);

  const gradingScale = university?.gradingScale || [];

  // Update local courses when level/semester changes or data arrives
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
      // Default empty rows
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

  // GPA Calculation Logic
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

  // CGPA Calculation Logic
  const calculateCgpa = () => {
    let totalCredits = 0;
    let totalPoints = 0;

    // Add all saved semesters EXCEPT the current active one
    semesters?.forEach(s => {
      if (s.level === activeLevel && s.semesterNumber === activeSemester) return;
      s.courses.forEach(c => {
        if (c.grade && c.creditHours > 0) {
          totalCredits += c.creditHours;
          totalPoints += (getPointsForGrade(c.grade) * c.creditHours);
        }
      });
    });

    // Add current local form state
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

  const handleSave = () => {
    // Filter out empty courses
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

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            {university.name} • {university.gradingSystem} System
          </p>
        </div>
        
        {/* Quick Stats Banner */}
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

      {/* Selectors */}
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
        <CardHeader className="bg-secondary/30 border-b border-border/40 px-6 py-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-xl">Level {activeLevel}, Sem {activeSemester}</CardTitle>
            <CardDescription>Enter your courses and grades to calculate GPA.</CardDescription>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Semester
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/20">
                <tr>
                  <th className="px-6 py-4 font-medium rounded-tl-lg">Course Code/Name</th>
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
    </div>
  );
}
