import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { UNIVERSITIES } from "../data/universities.js";

const router: IRouter = Router();

const authSchema = z.object({ username: z.string().min(1).max(50) });

function buildUserProfile(user: typeof usersTable.$inferSelect) {
  const uni = UNIVERSITIES.find((u) => u.id === user.universityId);
  return {
    id: user.id,
    username: user.username,
    universityId: user.universityId ?? null,
    universityName: uni?.name ?? null,
    currentLevel: user.currentLevel ?? null,
    themeColor: user.themeColor ?? null,
    customPrimaryColor: user.customPrimaryColor ?? null,
    customSecondaryColor: user.customSecondaryColor ?? null,
  };
}

router.post("/signup", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Username already taken. Please sign in instead." });
    return;
  }
  const [user] = await db.insert(usersTable).values({ username }).returning();
  (req.session as Record<string, unknown>).userId = user.id;
  res.json({ user: buildUserProfile(user) });
});

router.post("/signin", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Username not found. Please sign up first." });
    return;
  }
  (req.session as Record<string, unknown>).userId = user.id;
  res.json({ user: buildUserProfile(user) });
});

router.post("/signout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/me", async (req, res) => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(buildUserProfile(user));
});

export default router;
