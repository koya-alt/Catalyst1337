import { Router, type IRouter } from "express";
import {
  ConnectBotBody,
  ConnectBotResponse,
  DisconnectBotResponse,
  GetBotStatusResponse,
  GetBotGuildsResponse,
  GetBotChannelsQueryParams,
  GetBotChannelsResponse,
  LeaveGuildBody,
  LeaveGuildResponse,
  DeleteChannelsBody,
  DeleteChannelsResponse,
  DeleteRolesBody,
  DeleteRolesResponse,
  KickAllMembersBody,
  KickAllMembersResponse,
  BanAllMembersBody,
  BanAllMembersResponse,
  SendMessageBody,
  SendMessageResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import {
  connectBot,
  disconnectBot,
  getBotStatus,
  getGuilds,
  getChannels,
  leaveGuild,
  deleteAllChannels,
  deleteAllRoles,
  kickAllMembers,
  banAllMembers,
  sendMessage,
} from "../lib/botService";

const router: IRouter = Router();

router.get("/bot/status", requireAuth, (_req, res) => {
  const status = getBotStatus();
  const response = GetBotStatusResponse.parse(status);
  res.json(response);
});

router.post("/bot/connect", requireAuth, async (req, res) => {
  const parsed = ConnectBotBody.safeParse(req.body);
  if (!parsed.success) {
    const response = ConnectBotResponse.parse({ success: false, error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }
  const result = await connectBot(parsed.data.token);
  const response = ConnectBotResponse.parse(result);
  res.json(response);
});

router.post("/bot/disconnect", requireAuth, async (_req, res) => {
  await disconnectBot();
  const response = DisconnectBotResponse.parse({ success: true });
  res.json(response);
});

router.get("/bot/guilds", requireAuth, (_req, res) => {
  const guilds = getGuilds();
  const response = GetBotGuildsResponse.parse({ success: true, guilds });
  res.json(response);
});

router.get("/bot/channels", requireAuth, async (req, res) => {
  const parsed = GetBotChannelsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    const response = GetBotChannelsResponse.parse({ success: false, channels: [] });
    res.status(400).json(response);
    return;
  }
  try {
    const channels = await getChannels(parsed.data.guildId);
    const response = GetBotChannelsResponse.parse({ success: true, channels });
    res.json(response);
  } catch (err: unknown) {
    const response = GetBotChannelsResponse.parse({ success: false, channels: [] });
    res.status(400).json(response);
  }
});

router.post("/bot/leave-guild", requireAuth, async (req, res) => {
  const parsed = LeaveGuildBody.safeParse(req.body);
  if (!parsed.success) {
    const response = LeaveGuildResponse.parse({ success: false, error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }
  const result = await leaveGuild(parsed.data.guildId);
  const response = LeaveGuildResponse.parse(result);
  res.json(response);
});

router.post("/bot/delete-channels", requireAuth, async (req, res) => {
  const parsed = DeleteChannelsBody.safeParse(req.body);
  if (!parsed.success) {
    const response = DeleteChannelsResponse.parse({ success: false, results: [] });
    res.status(400).json(response);
    return;
  }
  const result = await deleteAllChannels(parsed.data.guildId);
  const response = DeleteChannelsResponse.parse(result);
  res.json(response);
});

router.post("/bot/delete-roles", requireAuth, async (req, res) => {
  const parsed = DeleteRolesBody.safeParse(req.body);
  if (!parsed.success) {
    const response = DeleteRolesResponse.parse({ success: false, results: [] });
    res.status(400).json(response);
    return;
  }
  const result = await deleteAllRoles(parsed.data.guildId);
  const response = DeleteRolesResponse.parse(result);
  res.json(response);
});

router.post("/bot/kick-all", requireAuth, async (req, res) => {
  const parsed = KickAllMembersBody.safeParse(req.body);
  if (!parsed.success) {
    const response = KickAllMembersResponse.parse({ success: false, results: [] });
    res.status(400).json(response);
    return;
  }
  const result = await kickAllMembers(parsed.data.guildId);
  const response = KickAllMembersResponse.parse(result);
  res.json(response);
});

router.post("/bot/ban-all", requireAuth, async (req, res) => {
  const parsed = BanAllMembersBody.safeParse(req.body);
  if (!parsed.success) {
    const response = BanAllMembersResponse.parse({ success: false, results: [] });
    res.status(400).json(response);
    return;
  }
  const result = await banAllMembers(parsed.data.guildId);
  const response = BanAllMembersResponse.parse(result);
  res.json(response);
});

router.post("/bot/send-message", requireAuth, async (req, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    const response = SendMessageResponse.parse({ success: false, error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }
  const result = await sendMessage(parsed.data.guildId, parsed.data.channelId, parsed.data.message);
  const response = SendMessageResponse.parse(result);
  res.json(response);
});

export default router;
