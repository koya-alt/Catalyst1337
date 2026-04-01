import { Router, type IRouter } from "express";
import {
  GetBotProfilesResponse,
  SaveBotProfileBody,
  SaveBotProfileResponse,
  OkResponse,
  ConnectBotResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import {
  getAllProfiles,
  saveProfile,
  deleteProfile,
  getProfileById,
  updateProfileUsername,
} from "../lib/botProfiles";
import { connectBot, getActiveProfileId } from "../lib/botService";

const router: IRouter = Router();

router.get("/bot/profiles", requireAuth, (_req, res) => {
  const profiles = getAllProfiles();
  const activeId = getActiveProfileId();
  const response = GetBotProfilesResponse.parse({
    success: true,
    profiles: profiles.map(p => ({
      id: p.id,
      name: p.name,
      username: p.username,
      active: p.id === activeId,
    })),
  });
  res.json(response);
});

router.post("/bot/profiles", requireAuth, (req, res) => {
  const parsed = SaveBotProfileBody.safeParse(req.body);
  if (!parsed.success) {
    const response = SaveBotProfileResponse.parse({ success: false, error: "Invalid body" });
    res.status(400).json(response);
    return;
  }
  const profile = saveProfile(parsed.data.name, parsed.data.token, parsed.data.id);
  const response = SaveBotProfileResponse.parse({ success: true, id: profile.id });
  res.json(response);
});

router.delete("/bot/profiles/:id", requireAuth, (req, res) => {
  const ok = deleteProfile(req.params.id);
  const response = OkResponse.parse({ success: ok });
  res.json(response);
});

router.post("/bot/profiles/:id/connect", requireAuth, async (req, res) => {
  const profile = getProfileById(req.params.id);
  if (!profile) {
    const response = ConnectBotResponse.parse({ success: false, error: "Profile not found" });
    res.status(404).json(response);
    return;
  }
  const result = await connectBot(profile.token, profile.id);
  if (result.success && result.username) {
    updateProfileUsername(profile.id, result.username);
  }
  const response = ConnectBotResponse.parse(result);
  res.json(response);
});

export default router;
