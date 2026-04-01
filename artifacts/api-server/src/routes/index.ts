import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import botRouter from "./bot";
import profilesRouter from "./profiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(botRouter);

export default router;
