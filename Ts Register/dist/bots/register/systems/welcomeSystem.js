"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWelcomeMessage = buildWelcomeMessage;
exports.buildRegisterCallMessage = buildRegisterCallMessage;
const discord_js_1 = require("discord.js");
const config_js_1 = require("../../../config.js");
function accountAgeText(ts) {
    const diff = Date.now() - ts;
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    if (years > 0)
        return `${years} yıl önce oluşturulmuş!`;
    const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
    return `${Math.max(months, 0)} ay önce oluşturulmuş!`;
}
function dateText(ts) {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date(ts));
}
function buildWelcomeMessage(member) {
    const responsible = `<@&${config_js_1.config.registerResponsibleRoleId}>`;
    const leader = `<@&${config_js_1.config.registerLeaderRoleId}>`;
    const supervisor = `<@&${config_js_1.config.registerSupervisorRoleId}>`;
    const rules = `<#${config_js_1.config.rulesChannelId}>`;
    const content = `Merhabalar! \`@${member.displayName || member.user.username}\`, aramıza hoşgeldin. Seninle beraber sunucumuz **${member.guild.memberCount}** üye sayısına ulaştı.

Hesabın \`${dateText(member.user.createdTimestamp)}\` tarihinde \`${accountAgeText(member.user.createdTimestamp)}\`

Sunucuya erişebilmek için Register odalarında kayıt olup ismini ve yaşını belirtmen gerekmektedir!

${rules} kanalından sunucu kurallarımızı okumayı ihmal etme!

${responsible} ${leader} ${supervisor} rolüne sahip yetkililer seninle ilgilenecektir.

Kayıt olmanız, kuralları kabul ettiğiniz anlamına gelir. Cezalar buna göre uygulanacaktır.`;
    const button = new discord_js_1.ButtonBuilder().setCustomId(`register_call:${member.id}`).setLabel("Kayıt Yetkilisini Çağır").setStyle(discord_js_1.ButtonStyle.Secondary);
    return { content, components: [new discord_js_1.ActionRowBuilder().addComponents(button)] };
}
function buildRegisterCallMessage(member) {
    const roleIds = [config_js_1.config.registerResponsibleRoleId, config_js_1.config.registerLeaderRoleId, config_js_1.config.registerSupervisorRoleId];
    return { content: `**Kayıt Yetkilisi Çağrısı**\n\n${member} kayıt olmak için yetkili bekliyor.\n\n${roleIds.map(id => `<@&${id}>`).join(" ")}`, roleIds };
}
