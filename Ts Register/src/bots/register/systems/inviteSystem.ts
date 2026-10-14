import { GuildMember, Invite } from "discord.js";
import { config } from "../../../config.js";
import { InviteRecord } from "../models/InviteRecord.js";
import { InviteJoin } from "../models/InviteJoin.js";
import { MemberRecord } from "../models/MemberRecord.js";
import { buildWelcomeMessage } from "./welcomeSystem.js";

export async function cacheGuildInvites(guild: any, cache: Map<string, Map<string, number>>) {
  try {
    const invites = await guild.invites.fetch();
    cache.set(guild.id, new Map([...invites.values()].map((i: any) => [i.code, i.uses ?? 0])));
  } catch (e) { console.error(`[INVITE CACHE] ${guild.name}`, e); }
}
export async function handleInviteCreate(invite: Invite) {
  await InviteRecord.findOneAndUpdate(
    { guildId: invite.guild.id, code: invite.code },
    { $set: { inviterId: invite.inviter?.id ?? null, uses: invite.uses ?? 0 } },
    { upsert: true }
  );
}
export async function handleMemberJoin(member: GuildMember, cache: Map<string, Map<string, number>>, refresh: (g: any) => Promise<void>) {
  let inviterId: string | null = null;
  let code: string | null = null;
  try {
    const old = cache.get(member.guild.id) ?? new Map<string, number>();
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
      if (used) await InviteRecord.findOneAndUpdate(
        { guildId: member.guild.id, code },
        { $set: { inviterId: used.inviter?.id ?? null, uses: used.uses ?? 0 } },
        { upsert: true }
      );
    }
    cache.set(member.guild.id, new Map([...current.values()].map(i => [i.code, i.uses ?? 0])));
  } catch (e) { console.error("[INVITE JOIN]", e); }

  await InviteJoin.findOneAndUpdate(
    { guildId: member.guild.id, invitedUserId: member.id },
    { $set: { inviterId, code, joinedAt: new Date(), leftAt: null } },
    { upsert: true }
  );

  const currentRecord = await MemberRecord.findOne({ guildId: member.guild.id, userId: member.id });
  try {
    if (currentRecord?.registered) {
      await member.roles.remove(config.unregisteredRoleId, "Eski kayıt otomatik uygulandı").catch(() => undefined);
    } else {
      await member.roles.add(config.unregisteredRoleId, "Yeni üye kayıtsız rolü");
    }
  } catch (e) { console.error("[AUTO ROLE]", e); }

  const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (welcomeChannel?.isTextBased()) {
    const welcome = buildWelcomeMessage(member);
    await welcomeChannel.send({
      content: welcome.content, components: welcome.components,
      allowedMentions: { users: [member.id], roles: [config.registerResponsibleRoleId, config.registerLeaderRoleId, config.registerSupervisorRoleId] }
    });
  }

  if (config.inviteLogChannelId) {
    const channel = await member.guild.channels.fetch(config.inviteLogChannelId).catch(() => null);
    if (channel?.isTextBased()) await channel.send(`📨 **Yeni davet**\n**Üye:** ${member}\n**Davet eden:** ${inviterId ? `<@${inviterId}>` : "Bilinmiyor"}\n**Kod:** \`${code ?? "Bilinmiyor"}\``);
  }
  await refresh(member.guild);
}
export async function handleMemberLeave(member: GuildMember) {
  await MemberRecord.findOneAndUpdate({ guildId: member.guild.id, userId: member.id }, { $set: { leftAt: new Date() } });
  await InviteJoin.findOneAndUpdate(
    { guildId: member.guild.id, invitedUserId: member.id, leftAt: null },
    { $set: { leftAt: new Date() } }
  );
  if (config.inviteLogChannelId) {
    const channel = await member.guild.channels.fetch(config.inviteLogChannelId).catch(() => null);
    if (channel?.isTextBased()) await channel.send(`📤 **Üye ayrıldı:** ${member} (\`${member.id}\`)`);
  }
}
