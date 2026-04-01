import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = req.session as { loggedIn?: boolean } | undefined;
  if (!session?.loggedIn) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
