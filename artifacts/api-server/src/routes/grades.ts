import { Router, type IRouter } from "express";
import { db, usersTable, semestersTable, coursesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { UNIVERSITIES } from "../data/universities.js";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function requireAuth(req: Parameters<Parameters<typeof router.get>[1]>[0], res: Parameters<Parameters<typeof router.get>[1]>[1]): number | null {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

function getGradePoints(grade: string, universityId: number | null): number {
  const uni = UNIVERSITIES.find((u) => u.id === universityId) ?? UNIVERSITIES[0];
  const found = uni.gradingScale.find((g) => g.grade === grade);
  return found ? found.points : 0;
}

function calculateGPA(courses: { creditHours: number; gradePoints: number | null }[]): number {
  const totalCredits = courses.reduce((sum, c) => sum + c.creditHours, 0);
  const totalPoints = courses.reduce((sum, c) => sum + c.creditHours * (c.gradePoints ?? 0), 0);
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}

function getClassification(cgpa: number, uni: (typeof UNIVERSITIES)[0]): string {
  if (cgpa >= uni.firstClass) return "First Class";
  if (cgpa >= uni.secondClassUpper) return "Second Class Upper";
  if (cgpa >= uni.secondClassLower) return "Second Class Lower";
  if (cgpa >= uni.thirdClass) return "Third Class";
  if (cgpa >= uni.pass) return "Pass";
  return "Fail";
}

function getLikelihood(currentCgpa: number, targetCgpa: number, remainingCredits: number, totalCreditsEarned: number): string {
  const gap = targetCgpa - currentCgpa;
  const proportion = remainingCredits / (remainingCredits + totalCreditsEarned);
  const difficulty = gap / (proportion + 0.01);
  if (difficulty <= 0) return "very_high";
  if (difficulty < 0.2) return "high";
  if (difficulty < 0.5) return "moderate";
  if (difficulty < 1.0) return "low";
  return "very_low";
}

type GradePoint = { grade: string; points: number };

function generateGradeRecommendations(
  requiredGpa: number,
  gradingScale: GradePoint[],
  numCourses: number
): { courseNumber: number; recommendedGrade: string; points: number }[] {
  const sorted = [...gradingScale].sort((a, b) => b.points - a.points);
  const maxPoints = sorted[0]?.points ?? 4;
  const minPoints = sorted[sorted.length - 1]?.points ?? 0;

  // Clamp required GPA to achievable range
  const clampedGpa = Math.min(maxPoints, Math.max(minPoints, requiredGpa));

  // Find upper and lower bracket grades
  const upper = sorted.find((g) => g.points >= clampedGpa) ?? sorted[0];
  const lowerArr = sorted.filter((g) => g.points < (upper?.points ?? 0));
  const lower = lowerArr.length > 0 ? lowerArr[0] : upper;

  let recommendations: { courseNumber: number; recommendedGrade: string; points: number }[] = [];

  if (!upper || !lower || upper.points === lower.points) {
    // All same grade
    for (let i = 1; i <= numCourses; i++) {
      recommendations.push({ courseNumber: i, recommendedGrade: upper?.grade ?? "A", points: upper?.points ?? maxPoints });
    }
  } else {
    // k * upper + (n - k) * lower = n * clampedGpa → k = n*(clampedGpa - lower) / (upper - lower)
    const k = Math.round(numCourses * (clampedGpa - lower.points) / (upper.points - lower.points));
    const upperCount = Math.min(numCourses, Math.max(0, k));
    const lowerCount = numCourses - upperCount;
    for (let i = 1; i <= upperCount; i++) {
      recommendations.push({ courseNumber: i, recommendedGrade: upper.grade, points: upper.points });
    }
    for (let i = upperCount + 1; i <= upperCount + lowerCount; i++) {
      recommendations.push({ courseNumber: i, recommendedGrade: lower.grade, points: lower.points });
    }
  }
  return recommendations;
}

// ─── Semesters ──────────────────────────────────────────────────────────────

router.get("/semesters", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const semesters = await db.select().from(semestersTable).where(eq(semestersTable.userId, userId));
  const result = await Promise.all(
    semesters.map(async (sem) => {
      const courses = await db.select().from(coursesTable).where(eq(coursesTable.semesterId, sem.id));
      return { ...sem, courses };
    })
  );
  res.json(result);
});

const saveCourseSchema = z.object({
  name: z.string().min(1),
  creditHours: z.number().positive(),
  grade: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
});

const saveSemesterSchema = z.object({
  level: z.number().int().min(100).max(600),
  semesterNumber: z.number().int().min(1).max(2),
  courses: z.array(saveCourseSchema),
});

router.post("/semesters", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = saveSemesterSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }

  const { level, semesterNumber, courses } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const existingSem = await db.select().from(semestersTable).where(
    and(eq(semestersTable.userId, userId), eq(semestersTable.level, level), eq(semestersTable.semesterNumber, semesterNumber))
  ).limit(1);

  let semesterId: number;
  if (existingSem.length > 0) {
    semesterId = existingSem[0].id;
    await db.delete(coursesTable).where(eq(coursesTable.semesterId, semesterId));
  } else {
    const [sem] = await db.insert(semestersTable).values({ userId, level, semesterNumber, gpa: 0 }).returning();
    semesterId = sem.id;
  }

  const insertedCourses = await Promise.all(
    courses.map(async (c) => {
      const gradePoints = c.grade ? getGradePoints(c.grade, user?.universityId ?? null) : null;
      const [course] = await db.insert(coursesTable).values({
        semesterId, name: c.name, creditHours: c.creditHours,
        grade: c.grade ?? null, score: c.score ?? null, gradePoints,
      }).returning();
      return course;
    })
  );

  const gpa = calculateGPA(insertedCourses);
  const [updatedSem] = await db.update(semestersTable).set({ gpa }).where(eq(semestersTable.id, semesterId)).returning();
  res.json({ ...updatedSem, courses: insertedCourses });
});

// ─── CGPA Goal ──────────────────────────────────────────────────────────────

async function computeGoalResponse(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return null;

  const semesters = await db.select().from(semestersTable).where(eq(semestersTable.userId, userId));
  let totalCredits = 0;
  let totalQualityPoints = 0;

  for (const sem of semesters) {
    const courses = await db.select().from(coursesTable).where(eq(coursesTable.semesterId, sem.id));
    const graded = courses.filter((c) => c.grade !== null);
    totalCredits += graded.reduce((s, c) => s + c.creditHours, 0);
    totalQualityPoints += graded.reduce((s, c) => s + c.creditHours * (c.gradePoints ?? 0), 0);
  }

  const currentCgpa = totalCredits > 0 ? Math.round((totalQualityPoints / totalCredits) * 100) / 100 : 0;
  const uni = UNIVERSITIES.find((u) => u.id === user.universityId) ?? UNIVERSITIES[0];
  const classification = totalCredits > 0 ? getClassification(currentCgpa, uni) : null;

  if (!user.targetCgpa) {
    return { targetCgpa: null, remainingCredits: null, remainingSemesters: null, coursesPerSemester: null, requiredGpa: null, likelihood: null, currentCgpa, classification, progressPercentage: null, semesterPlans: null };
  }

  const target = user.targetCgpa;
  const remaining = user.remainingCredits ?? 0;
  const remainingSemesters = user.remainingSemesters ?? null;
  const coursesPerSemester = user.coursesPerSemester ?? null;
  const neededPoints = target * (totalCredits + remaining) - totalQualityPoints;
  const requiredGpa = remaining > 0 ? Math.round((neededPoints / remaining) * 100) / 100 : null;
  const likelihood = getLikelihood(currentCgpa, target, remaining, totalCredits);

  // Progress bar: how close current CGPA is to target (0–100%)
  const progressPercentage = target > 0 ? Math.min(100, Math.round((currentCgpa / target) * 100)) : null;

  // Semester-by-semester plan with grade recommendations
  let semesterPlans = null;
  if (remainingSemesters && coursesPerSemester && requiredGpa !== null) {
    const creditsPerSemester = remaining / remainingSemesters;
    const gradingScale = uni.gradingScale;
    semesterPlans = Array.from({ length: remainingSemesters }, (_, i) => {
      const label = `Semester ${i + 1}`;
      const courseRecs = generateGradeRecommendations(requiredGpa, gradingScale, coursesPerSemester);
      return { semesterLabel: label, requiredGpa, courseRecommendations: courseRecs };
    });
  }

  return { targetCgpa: target, remainingCredits: remaining, remainingSemesters, coursesPerSemester, requiredGpa, likelihood, currentCgpa, classification, progressPercentage, semesterPlans };
}

router.get("/cgpa-goal", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const result = await computeGoalResponse(userId);
  if (!result) { res.status(401).json({ error: "User not found" }); return; }
  res.json(result);
});

const saveCgpaGoalSchema = z.object({
  targetCgpa: z.number().min(0).max(100),
  remainingCredits: z.number().min(0),
  remainingSemesters: z.number().int().positive().nullable().optional(),
  coursesPerSemester: z.number().int().positive().nullable().optional(),
});

router.post("/cgpa-goal", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = saveCgpaGoalSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }

  const { targetCgpa, remainingCredits, remainingSemesters, coursesPerSemester } = parsed.data;
  await db.update(usersTable).set({
    targetCgpa,
    remainingCredits,
    ...(remainingSemesters !== undefined ? { remainingSemesters } : {}),
    ...(coursesPerSemester !== undefined ? { coursesPerSemester } : {}),
  }).where(eq(usersTable.id, userId));

  const result = await computeGoalResponse(userId);
  if (!result) { res.status(500).json({ error: "Failed to compute goal" }); return; }
  res.json(result);
});

// ─── Parse Transcript ────────────────────────────────────────────────────────

const parseTranscriptSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().default("image/jpeg"),
});

router.post("/parse-transcript", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = parseTranscriptSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data — imageBase64 is required" }); return; }

  const { imageBase64, mimeType } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const uni = UNIVERSITIES.find((u) => u.id === user?.universityId) ?? UNIVERSITIES[0];
  const gradeNames = uni.gradingScale.map((g) => g.grade).join(", ");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an academic transcript parser. Extract all courses from this grade transcript image. 
Valid grade codes for this university are: ${gradeNames}.
Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"courses": [{"name": "COURSE NAME OR CODE", "creditHours": 3, "grade": "A"}]}
Rules:
- Only include courses that have a final grade assigned
- If credit hours are not visible, default to 3
- Match grades exactly to the valid codes listed above
- Course names should be the full name or code shown on the transcript`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(422).json({ courses: [], error: "Could not parse transcript — try a clearer image" });
      return;
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    res.json({ courses: parsedData.courses ?? [], error: null });
  } catch (err: any) {
    res.status(500).json({ courses: [], error: "AI parsing failed: " + (err?.message ?? "Unknown error") });
  }
});

// ─── Profile ─────────────────────────────────────────────────────────────────

const saveProfileSchema = z.object({
  universityId: z.number().nullable().optional(),
  currentLevel: z.number().nullable().optional(),
  themeColor: z.string().nullable().optional(),
  customPrimaryColor: z.string().nullable().optional(),
  customSecondaryColor: z.string().nullable().optional(),
});

router.post("/profile", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = saveProfileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.universityId !== undefined) updates.universityId = parsed.data.universityId;
  if (parsed.data.currentLevel !== undefined) updates.currentLevel = parsed.data.currentLevel;
  if (parsed.data.themeColor !== undefined) updates.themeColor = parsed.data.themeColor;
  if (parsed.data.customPrimaryColor !== undefined) updates.customPrimaryColor = parsed.data.customPrimaryColor;
  if (parsed.data.customSecondaryColor !== undefined) updates.customSecondaryColor = parsed.data.customSecondaryColor;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  const uni = UNIVERSITIES.find((u) => u.id === user.universityId);

  res.json({
    id: user.id,
    username: user.username,
    universityId: user.universityId ?? null,
    universityName: uni?.name ?? null,
    currentLevel: user.currentLevel ?? null,
    themeColor: user.themeColor ?? null,
    customPrimaryColor: user.customPrimaryColor ?? null,
    customSecondaryColor: user.customSecondaryColor ?? null,
  });
});

export default router;
