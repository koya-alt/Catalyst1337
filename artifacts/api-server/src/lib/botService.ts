import { Client, GatewayIntentBits, TextChannel, ChannelType } from "discord.js";
import { logger } from "./logger";

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
