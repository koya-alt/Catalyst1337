import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const PROFILES_FILE = join(process.cwd(), ".saved-bots.json");

export interface BotProfile {
  id: string;
  name: string;
  token: string;
  username?: string;
}

function readProfiles(): BotProfile[] {
  try {
    if (existsSync(PROFILES_FILE)) {
      return JSON.parse(readFileSync(PROFILES_FILE, "utf8"));
    }
  } catch {}
  return [];
}

function writeProfiles(profiles: BotProfile[]) {
  try {
    writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf8");
  } catch {}
}

export function getAllProfiles(): BotProfile[] {
  return readProfiles();
}

export function getProfileById(id: string): BotProfile | undefined {
  return readProfiles().find(p => p.id === id);
}

export function saveProfile(name: string, token: string, id?: string): BotProfile {
  const profiles = readProfiles();
  if (id) {
    const idx = profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], name, token };
      writeProfiles(profiles);
      return profiles[idx];
    }
  }
  const newProfile: BotProfile = { id: randomUUID(), name, token };
  profiles.push(newProfile);
  writeProfiles(profiles);
  return newProfile;
}

export function updateProfileUsername(id: string, username: string) {
  const profiles = readProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx !== -1) {
    profiles[idx].username = username;
    writeProfiles(profiles);
  }
}

export function deleteProfile(id: string): boolean {
  const profiles = readProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  if (filtered.length === profiles.length) return false;
  writeProfiles(filtered);
  return true;
}

export function getFirstProfile(): BotProfile | undefined {
  return readProfiles()[0];
}
