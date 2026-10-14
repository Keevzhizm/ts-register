import { EmbedBuilder, Message } from "discord.js";
import { config } from "../../../config.js";
import { MemberRecord } from "../models/MemberRecord.js";
import { RegisterHistory } from "../models/RegisterHistory.js";

export async function unregisterCommand(message: Message, args: string[]) {
  if (!message.guild || !message.member) return;
  const roles = [config.registerResponsibleRoleId, config.registerLeaderRoleId, config.registerSupervisorRoleId];
  const allowed = message.member.permissions.has("Administrator") || roles.some(id => message.member.roles.cache.has(id));
  if (!allowed) return void await message.reply("❌ Bu komutu kullanmak için kayıt yetkilisi olmalısın.");
  if (!args[0]) return void await message.reply(`❌ Kullanım: \`${config.prefix}kayıtsız @üye\` veya \`${config.prefix}kayıtsız ID\``);

  const id = message.mentions.users.first()?.id ?? args[0].replace(/[<@!>]/g, "");
  const target = await message.guild.members.fetch(id).catch(() => null);
  if (!target) return void await message.reply("❌ Bu kullanıcı sunucuda bulunamadı.");
  if (target.user.bot) return void await message.reply("❌ Botları kayıtsıza atamazsın.");

  const old = await MemberRecord.findOne({ guildId: message.guild.id, userId: target.id });
  const unregistered = message.guild.roles.cache.get(config.unregisteredRoleId);
  if (!unregistered) return void await message.reply("❌ Kayıtsız rolü bulunamadı.");

  try {
    await target.roles.remove(config.registeredMaleRoleId).catch(() => undefined);
    await target.roles.remove(config.registeredFemaleRoleId).catch(() => undefined);
    await target.roles.add(unregistered, "Kayıtsıza atıldı");
    await target.setNickname("✦ İsim | Yaş", "Kayıtsıza atıldı");

    await MemberRecord.findOneAndUpdate(
      { guildId: message.guild.id, userId: target.id },
      { $set: { registered: false, leftAt: null } },
      { upsert: true }
    );

    await RegisterHistory.create({
      guildId: message.guild.id, userId: target.id,
      name: old?.name ?? target.user.username,
      age: old?.age ?? 0, gender: old?.gender ?? "Bilinmiyor",
      registeredBy: message.author.id, action: "unregister"
    });

    const embed = new EmbedBuilder()
      .setColor(0xff3030)
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() ?? undefined })
      .setDescription(
        `${target} üyesi **kayıtsıza atıldı.**\n\n**Eski isim:** \`${old?.name ?? "Bilinmiyor"}\`\n**Eski yaş:** \`${old?.age ?? "Bilinmiyor"}\`\n**Eski cinsiyet:** \`${old?.gender ?? "Bilinmiyor"}\`\n\n**İşlemi yapan:** ${message.author}`
      ).setTimestamp();

    if (config.unregisterLogChannelId) {
      const channel = await message.guild.channels.fetch(config.unregisterLogChannelId).catch(() => null);
      if (channel?.isTextBased()) {
        const log = new EmbedBuilder()
          .setColor(0xff3030)
          .setAuthor({ name: "Kayıtsıza Atma Logu", iconURL: message.guild.iconURL() ?? undefined })
          .setDescription(
            `${target} kullanıcısı **kayıtsıza atıldı.**\n\n**Kullanıcı ID:** \`${target.id}\`\n**Eski isim:** \`${old?.name ?? "Bilinmiyor"}\`\n**Eski yaş:** \`${old?.age ?? "Bilinmiyor"}\`\n**Eski cinsiyet:** \`${old?.gender ?? "Bilinmiyor"}\`\n**İşlemi yapan:** ${message.author}`
          ).setFooter({ text: "Kayıtsız Sistemi" }).setTimestamp();
        await channel.send({ embeds: [log] });
      }
    }

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("[UNREGISTER COMMAND]", error);
    if (!message.replied) await message.reply("❌ Kullanıcı kayıtsıza atılırken bir hata oluştu.");
  }
}
