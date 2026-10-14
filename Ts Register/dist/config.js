"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    prefix: ".",
    guildId: "",
    welcomeChannelId: "",
    rulesChannelId: "",
    registerResponsibleRoleId: "",
    registerLeaderRoleId: "",
    registerSupervisorRoleId: "",
    unregisteredRoleId: "",
    registeredMaleRoleId: "",
    registeredFemaleRoleId: "",
    voiceChannelId: "",
    // Yeni log / istatistik kanalları.
    // Boş bırakırsan ilgili sistem gönderim yapmaz.
    registerLogChannelId: "",
    unregisterLogChannelId: "",
    inviteLogChannelId: "",
    moderationLogChannelId: "",
    registerStatsChannelId: "",
    inviteStatsChannelId: "",
    moderationStatsChannelId: "",
    colors: {
        dark: 0x151515,
        register: 0xe63956,
        invite: 0x4f8cff,
        moderation: 0x8b5cf6
    },
    statsUpdateIntervalMs: 60_000
};
