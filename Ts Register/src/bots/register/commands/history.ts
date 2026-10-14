import { EmbedBuilder, Message } from "discord.js";
import { RegisterHistory } from "../models/RegisterHistory.js";
import { config } from "../../../config.js";
export async function historyCommand(message: Message) {
  if (!message.guild || !message.member) return;
  const staffRoles = [config.registerResponsibleRoleId, config.registerLeaderRoleId, config.registerSupervisorRoleId];
  const allowed = message.member.permissions.has("Administrator") || staffRoles.some(id => message.member.roles.cache.has(id));
  if (!allowed) return void await message.reply("❌ Kayıt geçmişini görüntüleme yetkin yok.");
  let target = message.mentions.members?.first();
  if (!target) {
    const id = message.content.trim().split(/\s+/)[1];
    if (id && /^\d{17,20}$/.test(id)) target = await message.guild.members.fetch(id).catch(() => null) ?? undefined;
  }
  if (!target) return void await message.reply(`❌ Kullanıcı bulunamadı.\nKullanım: \`${message.content.split(" ")[0]} @üye\` veya \`${message.content.split(" ")[0]} ID\``);
  const records = await RegisterHistory.find({
    guildId: message.guild.id, userId: target.id,
    action: { $in: ["register", "auto-register"] }
  }).sort({ createdAt: -1 }).limit(15);
  if (!records.length) return void await message.reply(`❌ ${target} daha önce kayıt olmamış.`);
  const total = await RegisterHistory.countDocuments({ guildId: message.guild.id, userId: target.id, action: { $in: ["register", "auto-register"] } });
  const names = records.map((r, i) => {
    const date = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(r.createdAt);
    return `\` ${i + 1} \` \` ${r.name} | ${r.age} \` (${r.gender}) — <@${r.registeredBy}> \`${date}\``;
  }).join("\n");
  const embed = new EmbedBuilder()
    .setColor(0xe63956)
    .setDescription(`${target} üyesinin toplamda **${total}** isim kaydı bulundu.\n\n${names}\n\nÜyesinin önceki isimlerine \`.isimler ${target.id}\` komutuyla bakabilirsiniz.`)
    .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() ?? undefined })
    .setFooter({ text: "Shaneria Register Bot" }).setTimestamp();
  await message.reply({ embeds: [embed] });
}
