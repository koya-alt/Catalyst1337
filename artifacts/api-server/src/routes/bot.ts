import { Router, type IRouter } from "express";
import {
  ConnectBotBody,
  ConnectBotResponse,
  DisconnectBotResponse,
  GetBotStatusResponse,
  GetBotGuildsResponse,
  GetBotChannelsQueryParams,
  GetBotChannelsResponse,
  GetBotMembersQueryParams,
  GetBotMembersResponse,
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
  UnbanAllMembersBody,
  UnbanAllMembersResponse,
  NukeGuildBody,
  NukeGuildResponse,
  BanUserBody,
  BanUserResponse,
  KickUserBody,
  KickUserResponse,
  UnbanUserBody,
  UnbanUserResponse,
  DmAllMembersBody,
  DmAllMembersResponse,
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
  getMembers,
  leaveGuild,
  deleteAllChannels,
  deleteAllRoles,
  kickAllMembers,
  banAllMembers,
  unbanAllMembers,
  nukeGuild,
  banUser,
  kickUser,
  unbanUser,
  dmAllMembers,
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

router.get("/bot/members", requireAuth, async (req, res) => {
  const parsed = GetBotMembersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    const response = GetBotMembersResponse.parse({ success: false, members: [], error: "Invalid guildId" });
    res.status(400).json(response);
    return;
  }
  const result = await getMembers(parsed.data.guildId);
  const response = GetBotMembersResponse.parse(result);
  res.json(response);
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

router.post("/bot/unban-all", requireAuth, async (req, res) => {
  const parsed = UnbanAllMembersBody.safeParse(req.body);
  if (!parsed.success) {
    const response = UnbanAllMembersResponse.parse({ success: false, results: [] });
    res.status(400).json(response);
    return;
  }
  const result = await unbanAllMembers(parsed.data.guildId);
  const response = UnbanAllMembersResponse.parse(result);
  res.json(response);
});

router.post("/bot/nuke", requireAuth, async (req, res) => {
  const parsed = NukeGuildBody.safeParse(req.body);
  if (!parsed.success) {
    const response = NukeGuildResponse.parse({ success: false, steps: [], error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }
  const { guildId, deleteChannels, deleteRoles, kickAll, banAll, leaveAfter } = parsed.data;
  const result = await nukeGuild(guildId, { deleteChannels, deleteRoles, kickAll, banAll, leaveAfter });
  const response = NukeGuildResponse.parse(result);
  res.json(response);
});

router.post("/bot/ban-user", requireAuth, async (req, res) => {
  const parsed = BanUserBody.safeParse(req.body);
  if (!parsed.success) {
    const response = BanUserResponse.parse({ success: false, error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }
  const result = await banUser(parsed.data.guildId, parsed.data.userId, parsed.data.reason);
  const response = BanUserResponse.parse(result);
  res.json(response);
});

router.post("/bot/kick-user", requireAuth, async (req, res) => {
  const parsed = KickUserBody.safeParse(req.body);
  if (!parsed.success) {
    const response = KickUserResponse.parse({ success: false, error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }
  const result = await kickUser(parsed.data.guildId, parsed.data.userId, parsed.data.reason);
  const response = KickUserResponse.parse(result);
  res.json(response);
});

router.post("/bot/unban-user", requireAuth, async (req, res) => {
  const parsed = UnbanUserBody.safeParse(req.body);
  if (!parsed.success) {
    const response = UnbanUserResponse.parse({ success: false, error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }
  const result = await unbanUser(parsed.data.guildId, parsed.data.userId, parsed.data.reason);
  const response = UnbanUserResponse.parse(result);
  res.json(response);
});

router.post("/bot/dm-all", requireAuth, async (req, res) => {
  const parsed = DmAllMembersBody.safeParse(req.body);
  if (!parsed.success) {
    const response = DmAllMembersResponse.parse({ success: false, results: [], error: "Invalid request body" });
    res.status(400).json(response);
    return;
  }
  const result = await dmAllMembers(parsed.data.guildId, parsed.data.message);
  const response = DmAllMembersResponse.parse(result);
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
