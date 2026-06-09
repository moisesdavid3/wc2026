import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import matchesRouter from "./matches";
import predictionsRouter from "./predictions";
import leaderboardRouter from "./leaderboard";
import usersRouter from "./users";
import adminRouter from "./admin";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(teamsRouter);
router.use(matchesRouter);
router.use(predictionsRouter);
router.use(leaderboardRouter);
router.use(usersRouter);
router.use(adminRouter);

export default router;
