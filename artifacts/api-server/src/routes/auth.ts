import { Router, type IRouter } from "express";
import {
  LoginBody,
  LoginResponse,
  LogoutResponse,
  AuthCheckResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD ?? "catalyst2024";

router.post("/auth/login", (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    const response = LoginResponse.parse({ success: false, error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }

  const { password } = parsed.data;
  if (password !== DASHBOARD_PASSWORD) {
    const response = LoginResponse.parse({ success: false, error: "Incorrect password" });
    res.status(401).json(response);
    return;
  }

  (req.session as { loggedIn?: boolean }).loggedIn = true;
  const response = LoginResponse.parse({ success: true });
  res.json(response);
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    const response = LogoutResponse.parse({ success: true });
    res.json(response);
  });
});

router.get("/auth/check", (req, res) => {
  const session = req.session as { loggedIn?: boolean };
  const response = AuthCheckResponse.parse({ loggedIn: !!session.loggedIn });
  res.json(response);
});

export default router;
