"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startModerationTracker = startModerationTracker;
const discord_js_1 = require("discord.js");
const config_js_1 = require("../../../config.js");
const ModerationRecord_js_1 = require("../models/ModerationRecord.js");
async function executorFor(guild, type, targetId) {
    const logs = await guild.fetchAuditLogs({ type, limit: 10 });
    return logs.entries.find((x) => x.target?.id === targetId && Date.now() - x.createdTimestamp < 15000) ?? null;
}
function startModerationTracker(client) {
    client.on("guildBanAdd", async (ban) => { try {
        const e = await executorFor(ban.guild, discord_js_1.AuditLogEvent.MemberBanAdd, ban.user.id);
        if (!e?.executor?.id)
            return;
        await ModerationRecord_js_1.ModerationRecord.create({ guildId: ban.guild.id, moderatorId: e.executor.id, targetId: ban.user.id, action: "ban", reason: e.reason ?? null });
        if (config_js_1.config.moderationLogChannelId) {
            const c = await ban.guild.channels.fetch(config_js_1.config.moderationLogChannelId).catch(() => null);
            if (c?.isTextBased())
                await c.send(`🔨 **Ban**\n**Yetkili:** <@${e.executor.id}>\n**Üye:** <@${ban.user.id}>`);
        }
    }
    catch (err) {
        console.error("[MOD BAN]", err);
    } });
    client.on("guildBanRemove", async (ban) => { try {
        const e = await executorFor(ban.guild, discord_js_1.AuditLogEvent.MemberBanRemove, ban.user.id);
        if (!e?.executor?.id)
            return;
        await ModerationRecord_js_1.ModerationRecord.create({ guildId: ban.guild.id, moderatorId: e.executor.id, targetId: ban.user.id, action: "unban", reason: e.reason ?? null });
        if (config_js_1.config.moderationLogChannelId) {
            const c = await ban.guild.channels.fetch(config_js_1.config.moderationLogChannelId).catch(() => null);
            if (c?.isTextBased())
                await c.send(`🔓 **Unban**\n**Yetkili:** <@${e.executor.id}>\n**Üye:** <@${ban.user.id}>`);
        }
    }
    catch (err) {
        console.error("[MOD UNBAN]", err);
    } });
    client.on("guildMemberRemove", async (member) => { try {
        const e = await executorFor(member.guild, discord_js_1.AuditLogEvent.MemberKick, member.id);
        if (!e?.executor?.id)
            return;
        await ModerationRecord_js_1.ModerationRecord.create({ guildId: member.guild.id, moderatorId: e.executor.id, targetId: member.id, action: "kick", reason: e.reason ?? null });
        if (config_js_1.config.moderationLogChannelId) {
            const c = await member.guild.channels.fetch(config_js_1.config.moderationLogChannelId).catch(() => null);
            if (c?.isTextBased())
                await c.send(`👢 **Kick**\n**Yetkili:** <@${e.executor.id}>\n**Üye:** <@${member.id}>`);
        }
    }
    catch (err) {
        console.error("[MOD KICK]", err);
    } });
}
