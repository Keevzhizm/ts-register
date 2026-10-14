"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyCommand = historyCommand;
const discord_js_1 = require("discord.js");
const RegisterHistory_js_1 = require("../models/RegisterHistory.js");
async function historyCommand(message) {
    if (!message.guild)
        return;
    let target = message.mentions.members?.first();
    if (!target) {
        const id = message.content.trim().split(/\s+/)[1];
        if (id && /^\d{17,20}$/.test(id))
            target = await message.guild.members.fetch(id).catch(() => null) ?? undefined;
    }
    if (!target)
        return void await message.reply(`❌ Kullanıcı bulunamadı.\nKullanım: \`${message.content.split(" ")[0]} @üye\` veya \`${message.content.split(" ")[0]} ID\``);
    const records = await RegisterHistory_js_1.RegisterHistory.find({
        guildId: message.guild.id, userId: target.id,
        action: { $in: ["register", "auto-register"] }
    }).sort({ createdAt: -1 });
    if (!records.length)
        return void await message.reply(`❌ ${target} daha önce kayıt olmamış.`);
    const names = records.map((r, i) => {
        const date = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(r.createdAt);
        return `\` ${i + 1} \` \` ${r.name} | ${r.age} \` (${r.gender}) — <@${r.registeredBy}> \`${date}\``;
    }).join("\n");
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xe63956)
        .setDescription(`${target} üyesinin toplamda **${records.length}** isim kayıtı bulundu.\n\n${names}\n\nÜyesinin önceki isimlerine \`.isimler ${target.id}\` komutuyla bakabilirsiniz.`)
        .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() ?? undefined })
        .setFooter({ text: "Shaneria Register Bot" }).setTimestamp();
    await message.reply({ embeds: [embed] });
}
