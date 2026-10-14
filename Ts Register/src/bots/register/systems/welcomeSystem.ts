import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember } from "discord.js";
import { config } from "../../../config.js";

function accountAgeText(ts: number) {
  const diff = Date.now() - ts;
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  if (years > 0) return `${years} yıl önce oluşturulmuş!`;
  const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
  return `${Math.max(months, 0)} ay önce oluşturulmuş!`;
}
function dateText(ts: number) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date(ts));
}
export function buildWelcomeMessage(member: GuildMember) {
  const responsible = `<@&${config.registerResponsibleRoleId}>`;
  const leader = `<@&${config.registerLeaderRoleId}>`;
  const supervisor = `<@&${config.registerSupervisorRoleId}>`;
  const rules = `<#${config.rulesChannelId}>`;
  const content =
`Merhabalar! \`@${member.displayName || member.user.username}\`, aramıza hoşgeldin. Seninle beraber sunucumuz **${member.guild.memberCount}** üye sayısına ulaştı.

Hesabın \`${dateText(member.user.createdTimestamp)}\` tarihinde \`${accountAgeText(member.user.createdTimestamp)}\`

Sunucuya erişebilmek için Register odalarında kayıt olup ismini ve yaşını belirtmen gerekmektedir!

${rules} kanalından sunucu kurallarımızı okumayı ihmal etme!

${responsible} ${leader} ${supervisor} rolüne sahip yetkililer seninle ilgilenecektir.

Kayıt olmanız, kuralları kabul ettiğiniz anlamına gelir. Cezalar buna göre uygulanacaktır.`;
  const button = new ButtonBuilder().setCustomId(`register_call:${member.id}`).setLabel("Kayıt Yetkilisini Çağır").setStyle(ButtonStyle.Secondary);
  return { content, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)] };
}
export function buildRegisterCallMessage(member: GuildMember) {
  const roleIds = [config.registerResponsibleRoleId, config.registerLeaderRoleId, config.registerSupervisorRoleId];
  return { content: `**Kayıt Yetkilisi Çağrısı**\n\n${member} kayıt olmak için yetkili bekliyor.\n\n${roleIds.map(id => `<@&${id}>`).join(" ")}`, roleIds };
}
