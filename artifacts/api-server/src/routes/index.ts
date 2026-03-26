import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import universitiesRouter from "./universities";
import gradesRouter from "./grades";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/universities", universitiesRouter);
router.use("/grades", gradesRouter);

export default router;
