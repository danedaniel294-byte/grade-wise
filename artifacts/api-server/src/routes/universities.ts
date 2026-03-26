import { Router, type IRouter } from "express";
import { UNIVERSITIES } from "../data/universities.js";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json(UNIVERSITIES);
});

export default router;
