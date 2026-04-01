import { Router, type IRouter } from "express";
import {
  GetBotProfilesResponse,
  SaveBotProfileBody,
  SaveBotProfileResponse,
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
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch profiles" });
  }
});

router.post("/bot/profiles", requireAuth, (req, res) => {
  try {
    const parsed = SaveBotProfileBody.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
      });
    }

    const profile = saveProfile(
      parsed.data.name,
      parsed.data.token,
      parsed.data.id
    );

    const response = SaveBotProfileResponse.parse({
      success: true,
      id: profile.id,
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to save profile" });
  }
});

router.delete("/bot/profiles/:id", requireAuth, (req, res) => {
  try {
    const ok = deleteProfile(req.params.id);

    res.json({
      success: ok,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete profile" });
  }
});

router.post("/bot/profiles/:id/connect", requireAuth, async (req, res) => {
  try {
    const profile = getProfileById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    const result = await connectBot(profile.token, profile.id);

    if (result.success && result.username) {
      updateProfileUsername(profile.id, result.username);
    }

    const response = ConnectBotResponse.parse(result);
    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to connect bot" });
  }
});

export default router;