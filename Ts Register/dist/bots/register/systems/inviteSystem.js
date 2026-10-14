"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGuildInvites = cacheGuildInvites;
exports.handleInviteCreate = handleInviteCreate;
exports.handleMemberJoin = handleMemberJoin;
exports.handleMemberLeave = handleMemberLeave;
const config_js_1 = require("../../../config.js");
const InviteRecord_js_1 = require("../models/InviteRecord.js");
const InviteJoin_js_1 = require("../models/InviteJoin.js");
const MemberRecord_js_1 = require("../models/MemberRecord.js");
const welcomeSystem_js_1 = require("./welcomeSystem.js");
async function cacheGuildInvites(guild, cache) {
    try {
        const invites = await guild.invites.fetch();
        cache.set(guild.id, new Map([...invites.values()].map((i) => [i.code, i.uses ?? 0])));
    }
    catch (e) {
        console.error(`[INVITE CACHE] ${guild.name}`, e);
    }
}
async function handleInviteCreate(invite) {
    await InviteRecord_js_1.InviteRecord.findOneAndUpdate({ guildId: invite.guild.id, code: invite.code }, { $set: { inviterId: invite.inviter?.id ?? null, uses: invite.uses ?? 0 } }, { upsert: true });
}
async function handleMemberJoin(member, cache, refresh) {
    let inviterId = null;
    let code = null;
    try {
        const old = cache.get(member.guild.id) ?? new Map();
        const current = await member.guild.invites.fetch();
        for (const invite of current.values()) {
            if ((invite.uses ?? 0) > (old.get(invite.code) ?? 0)) {
                inviterId = invite.inviter?.id ?? null;
                code = invite.code;
                break;
            }
        }
        if (code) {
            const used = current.get(code);
            if (used)
                await InviteRecord_js_1.InviteRecord.findOneAndUpdate({ guildId: member.guild.id, code }, { $set: { inviterId: used.inviter?.id ?? null, uses: used.uses ?? 0 } }, { upsert: true });
        }
        cache.set(member.guild.id, new Map([...current.values()].map(i => [i.code, i.uses ?? 0])));
    }
    catch (e) {
        console.error("[INVITE JOIN]", e);
    }
    await InviteJoin_js_1.InviteJoin.findOneAndUpdate({ guildId: member.guild.id, invitedUserId: member.id }, { $set: { inviterId, code, joinedAt: new Date(), leftAt: null } }, { upsert: true });
    const currentRecord = await MemberRecord_js_1.MemberRecord.findOne({ guildId: member.guild.id, userId: member.id });
    try {
        if (currentRecord?.registered) {
            await member.roles.remove(config_js_1.config.unregisteredRoleId, "Eski kayıt otomatik uygulandı").catch(() => undefined);
        }
        else {
            await member.roles.add(config_js_1.config.unregisteredRoleId, "Yeni üye kayıtsız rolü");
        }
    }
    catch (e) {
        console.error("[AUTO ROLE]", e);
    }
    const welcomeChannel = member.guild.channels.cache.get(config_js_1.config.welcomeChannelId);
    if (welcomeChannel?.isTextBased()) {
        const welcome = (0, welcomeSystem_js_1.buildWelcomeMessage)(member);
        await welcomeChannel.send({
            content: welcome.content, components: welcome.components,
            allowedMentions: { users: [member.id], roles: [config_js_1.config.registerResponsibleRoleId, config_js_1.config.registerLeaderRoleId, config_js_1.config.registerSupervisorRoleId] }
        });
    }
    if (config_js_1.config.inviteLogChannelId) {
        const channel = await member.guild.channels.fetch(config_js_1.config.inviteLogChannelId).catch(() => null);
        if (channel?.isTextBased())
            await channel.send(`📨 **Yeni davet**\n**Üye:** ${member}\n**Davet eden:** ${inviterId ? `<@${inviterId}>` : "Bilinmiyor"}\n**Kod:** \`${code ?? "Bilinmiyor"}\``);
    }
    await refresh(member.guild);
}
async function handleMemberLeave(member) {
    await MemberRecord_js_1.MemberRecord.findOneAndUpdate({ guildId: member.guild.id, userId: member.id }, { $set: { leftAt: new Date() } });
    await InviteJoin_js_1.InviteJoin.findOneAndUpdate({ guildId: member.guild.id, invitedUserId: member.id, leftAt: null }, { $set: { leftAt: new Date() } });
    if (config_js_1.config.inviteLogChannelId) {
        const channel = await member.guild.channels.fetch(config_js_1.config.inviteLogChannelId).catch(() => null);
        if (channel?.isTextBased())
            await channel.send(`📤 **Üye ayrıldı:** ${member} (\`${member.id}\`)`);
    }
}
