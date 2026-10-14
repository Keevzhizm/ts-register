"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationStatsCommand = moderationStatsCommand;
const discord_js_1 = require("discord.js");
const config_js_1 = require("../../../config.js");
const ModerationRecord_js_1 = require("../models/ModerationRecord.js");
async function moderationStatsCommand(message, args) {
    if (!message.guild)
        return;
    const id = message.mentions.users.first()?.id ?? (args[0] && /^\d{17,20}$/.test(args[0]) ? args[0] : message.author.id);
    const target = await message.guild.members.fetch(id).catch(() => null);
    const rows = await ModerationRecord_js_1.ModerationRecord.aggregate([
        { $match: { guildId: message.guild.id, moderatorId: id } },
        { $group: { _id: "$action", count: { $sum: 1 } } }
    ]);
    const map = new Map(rows.map(r => [String(r._id), Number(r.count)]));
    const total = [...map.values()].reduce((a, b) => a + b, 0);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(config_js_1.config.colors.moderation)
        .setTitle("Moderasyon İstatistikleri")
        .setDescription(`${target ?? `<@${id}>`} için moderasyon istatistikleri`)
        .addFields({ name: "Toplam", value: `\`${total}\``, inline: true }, { name: "Ban", value: `\`${map.get("ban") ?? 0}\``, inline: true }, { name: "Kick", value: `\`${map.get("kick") ?? 0}\``, inline: true }, { name: "Unban", value: `\`${map.get("unban") ?? 0}\``, inline: true }).setTimestamp();
    await message.reply({ embeds: [embed] });
}
