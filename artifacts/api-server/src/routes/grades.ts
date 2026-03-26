import { Router, type IRouter } from "express";
import { db, usersTable, semestersTable, coursesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { UNIVERSITIES } from "../data/universities.js";

const router: IRouter = Router();

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
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

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
        semesterId,
        name: c.name,
        creditHours: c.creditHours,
        grade: c.grade ?? null,
        score: c.score ?? null,
        gradePoints,
      }).returning();
      return course;
    })
  );

  const gpa = calculateGPA(insertedCourses);
  const [updatedSem] = await db.update(semestersTable).set({ gpa }).where(eq(semestersTable.id, semesterId)).returning();

  res.json({ ...updatedSem, courses: insertedCourses });
});

router.get("/cgpa-goal", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const semesters = await db.select().from(semestersTable).where(eq(semestersTable.userId, userId));
  let totalCredits = 0;
  let totalQualityPoints = 0;

  for (const sem of semesters) {
    const courses = await db.select().from(coursesTable).where(eq(coursesTable.semesterId, sem.id));
    const graded = courses.filter((c) => c.grade !== null);
    const semCredits = graded.reduce((s, c) => s + c.creditHours, 0);
    const semPoints = graded.reduce((s, c) => s + c.creditHours * (c.gradePoints ?? 0), 0);
    totalCredits += semCredits;
    totalQualityPoints += semPoints;
  }

  const currentCgpa = totalCredits > 0 ? Math.round((totalQualityPoints / totalCredits) * 100) / 100 : 0;
  const uni = UNIVERSITIES.find((u) => u.id === user.universityId) ?? UNIVERSITIES[0];
  const classification = totalCredits > 0 ? getClassification(currentCgpa, uni) : null;

  if (!user.targetCgpa) {
    res.json({ targetCgpa: null, remainingCredits: null, requiredGpa: null, likelihood: null, currentCgpa, classification });
    return;
  }

  const target = user.targetCgpa;
  const remaining = user.remainingCredits ?? 0;
  const neededPoints = target * (totalCredits + remaining) - totalQualityPoints;
  const requiredGpa = remaining > 0 ? Math.round((neededPoints / remaining) * 100) / 100 : null;
  const likelihood = getLikelihood(currentCgpa, target, remaining, totalCredits);

  res.json({ targetCgpa: target, remainingCredits: remaining, requiredGpa, likelihood, currentCgpa, classification });
});

const saveCgpaGoalSchema = z.object({
  targetCgpa: z.number().min(0).max(4),
  remainingCredits: z.number().min(0),
});

router.post("/cgpa-goal", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = saveCgpaGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  const { targetCgpa, remainingCredits } = parsed.data;
  await db.update(usersTable).set({ targetCgpa, remainingCredits }).where(eq(usersTable.id, userId));

  const semesters = await db.select().from(semestersTable).where(eq(semestersTable.userId, userId));
  let totalCredits = 0;
  let totalQualityPoints = 0;

  for (const sem of semesters) {
    const courses = await db.select().from(coursesTable).where(eq(coursesTable.semesterId, sem.id));
    const graded = courses.filter((c) => c.grade !== null);
    const semCredits = graded.reduce((s, c) => s + c.creditHours, 0);
    const semPoints = graded.reduce((s, c) => s + c.creditHours * (c.gradePoints ?? 0), 0);
    totalCredits += semCredits;
    totalQualityPoints += semPoints;
  }

  const currentCgpa = totalCredits > 0 ? Math.round((totalQualityPoints / totalCredits) * 100) / 100 : 0;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const uni = UNIVERSITIES.find((u) => u.id === user?.universityId) ?? UNIVERSITIES[0];
  const classification = totalCredits > 0 ? getClassification(currentCgpa, uni) : null;

  const neededPoints = targetCgpa * (totalCredits + remainingCredits) - totalQualityPoints;
  const requiredGpa = remainingCredits > 0 ? Math.round((neededPoints / remainingCredits) * 100) / 100 : null;
  const likelihood = getLikelihood(currentCgpa, targetCgpa, remainingCredits, totalCredits);

  res.json({ targetCgpa, remainingCredits, requiredGpa, likelihood, currentCgpa, classification });
});

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
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

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
