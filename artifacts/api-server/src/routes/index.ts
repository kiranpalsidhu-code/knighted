import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resumeReadyRouter from "./resumeReady";
import knightedJobsRouter from "./knightedJobs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(resumeReadyRouter);
router.use(knightedJobsRouter);

export default router;
