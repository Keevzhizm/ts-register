const env = (key: string) => process.env[key]?.trim() ?? "";

export const config = {
  prefix: env("BOT_PREFIX") || ".",
  guildId: env("DISCORD_GUILD_ID"),

  welcomeChannelId: env("WELCOME_CHANNEL_ID"),
  rulesChannelId: env("RULES_CHANNEL_ID"),

  registerResponsibleRoleId: env("REGISTER_RESPONSIBLE_ROLE_ID"),
  registerLeaderRoleId: env("REGISTER_LEADER_ROLE_ID"),
  registerSupervisorRoleId: env("REGISTER_SUPERVISOR_ROLE_ID"),

  unregisteredRoleId: env("UNREGISTERED_ROLE_ID"),
  registeredMaleRoleId: env("REGISTERED_MALE_ROLE_ID"),
  registeredFemaleRoleId: env("REGISTERED_FEMALE_ROLE_ID"),
  voiceChannelId: env("VOICE_CHANNEL_ID"),

  registerLogChannelId: env("REGISTER_LOG_CHANNEL_ID"),
  unregisterLogChannelId: env("UNREGISTER_LOG_CHANNEL_ID"),
  inviteLogChannelId: env("INVITE_LOG_CHANNEL_ID"),
  moderationLogChannelId: env("MODERATION_LOG_CHANNEL_ID"),
  leaderboardChannelId: env("LEADERBOARD_CHANNEL_ID"),
  registerStatsChannelId: env("REGISTER_STATS_CHANNEL_ID"),
  inviteStatsChannelId: env("INVITE_STATS_CHANNEL_ID"),
  moderationStatsChannelId: env("MODERATION_STATS_CHANNEL_ID"),

  colors: {
    dark: 0x151515,
    register: 0xe63956,
    invite: 0x4f8cff,
    moderation: 0x8b5cf6
  },

  statsUpdateIntervalMs: Math.max(10_000, Number(process.env.STATS_UPDATE_INTERVAL_MS) || 60_000)
} as const;

const requiredIds = [
  "DISCORD_GUILD_ID",
  "REGISTER_RESPONSIBLE_ROLE_ID",
  "REGISTER_LEADER_ROLE_ID",
  "REGISTER_SUPERVISOR_ROLE_ID",
  "UNREGISTERED_ROLE_ID",
  "REGISTERED_MALE_ROLE_ID",
  "REGISTERED_FEMALE_ROLE_ID"
] as const;

const optionalIds = [
  "WELCOME_CHANNEL_ID", "RULES_CHANNEL_ID", "VOICE_CHANNEL_ID",
  "REGISTER_LOG_CHANNEL_ID", "UNREGISTER_LOG_CHANNEL_ID", "INVITE_LOG_CHANNEL_ID",
  "MODERATION_LOG_CHANNEL_ID", "LEADERBOARD_CHANNEL_ID", "REGISTER_STATS_CHANNEL_ID",
  "INVITE_STATS_CHANNEL_ID", "MODERATION_STATS_CHANNEL_ID"
] as const;

export function validateConfig() {
  const missing = requiredIds.filter(key => !env(key));
  if (missing.length) {
    throw new Error(".env içinde gerekli sunucu/rol ayarları eksik: " + missing.join(", "));
  }

  const invalid = [...requiredIds, ...optionalIds].filter(key => {
    const value = env(key);
    return value.length > 0 && !/^\d{17,20}$/.test(value);
  });
  if (invalid.length) {
    throw new Error("Discord ID biçimi geçersiz olan ayarlar: " + invalid.join(", "));
  }
}
