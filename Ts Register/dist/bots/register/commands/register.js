"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommand = registerCommand;
exports.handleRegisterButton = handleRegisterButton;
const discord_js_1 = require("discord.js");
const config_js_1 = require("../../../config.js");
const MemberRecord_js_1 = require("../models/MemberRecord.js");
const RegisterHistory_js_1 = require("../models/RegisterHistory.js");
async function registerCommand(message, args) {
    if (!message.guild || !message.member)
        return;
    const roles = [config_js_1.config.registerResponsibleRoleId, config_js_1.config.registerLeaderRoleId, config_js_1.config.registerSupervisorRoleId];
    const allowed = message.member.permissions.has("Administrator") || roles.some(id => message.member.roles.cache.has(id));
    if (!allowed)
        return void await message.reply("❌ Bu komutu kullanmak için kayıt yetkin bulunmuyor.");
    if (!args[0] || args.length < 3) {
        return void await message.reply(`❌ Kullanım: \`${config_js_1.config.prefix}kayıt @üye İsim Yaş\` veya \`${config_js_1.config.prefix}kayıt ID İsim Yaş\``);
    }
    const userId = message.mentions.members?.first()?.id ?? args[0].replace(/[<@!>]/g, "");
    const age = Number(args[args.length - 1]);
    const name = args.slice(1, -1).join(" ");
    if (!/^\d{17,20}$/.test(userId))
        return void await message.reply("❌ Geçerli bir Discord kullanıcı ID'si veya etiket gir.");
    if (!name || !Number.isInteger(age) || age < 13 || age > 100)
        return void await message.reply("❌ Geçerli bir isim ve 13-100 arasında bir yaş gir.");
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member)
        return void await message.reply("❌ Bu kullanıcı sunucuda bulunamadı.");
    if (member.user.bot)
        return void await message.reply("❌ Botları kayıt edemezsin.");
    const oldRecords = await RegisterHistory_js_1.RegisterHistory.find({
        guildId: message.guild.id, userId: member.id,
        action: { $in: ["register", "auto-register"] }
    }).sort({ createdAt: -1 }).limit(10);
    const history = oldRecords.length
        ? oldRecords.slice(0, 3).map((x, i) => `\` ${i + 1} \` \` ${x.name} | ${x.age} \` ${x.gender ? `(${x.gender})` : ""}`).join("\n")
        : "Daha önce kayıt olmamış.";
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(config_js_1.config.colors.register)
        .setDescription(`
${member} üyesinin ismi "${name}" olarak değiştirildi, bu üye daha önce bu isimlerle kayıt olmuş.

${member} üyesinin toplamda **${oldRecords.length}** isim kayıtı bulundu
${history}

Üyesinin önceki isimlerine \`.isimler <@${member.id}>\` komutuyla bakarak kayıt işlemini gerçekleştirmeniz önerilir.
`)
        .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() ?? undefined })
        .setFooter({ text: "30 saniye alttaki butonlara basarak kullanıcının cinsiyetini belirleyin." });
    const enc = encodeURIComponent(name);
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`register_gender:${member.id}:${message.author.id}:Erkek:${enc}:${age}`).setLabel("Erkek").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId(`register_gender:${member.id}:${message.author.id}:Kadın:${enc}:${age}`).setLabel("Kadın").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId(`register_cancel:${message.author.id}`).setLabel("İptal").setStyle(discord_js_1.ButtonStyle.Danger));
    await message.reply({ embeds: [embed], components: [row] });
}
async function handleRegisterButton(interaction) {
    if (!interaction.isButton())
        return false;
    if (interaction.customId.startsWith("register_gender:")) {
        const parts = interaction.customId.split(":");
        const userId = parts[1], registrarId = parts[2];
        const gender = parts[3];
        const name = decodeURIComponent(parts[4]);
        const age = Number(parts[5]);
        if (interaction.user.id !== registrarId) {
            await interaction.reply({ content: "❌ Bu kayıt panelini yalnızca paneli oluşturan yetkili kullanabilir.", ephemeral: true });
            return true;
        }
        const guild = interaction.guild;
        if (!guild)
            return true;
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            await interaction.reply({ content: "❌ Kullanıcı artık sunucuda bulunmuyor.", ephemeral: true });
            return true;
        }
        try {
            const oldNickname = member.nickname || member.user.username;
            await MemberRecord_js_1.MemberRecord.findOne({ guildId: guild.id, userId: member.id });
            await member.roles.remove(config_js_1.config.unregisteredRoleId).catch(() => undefined);
            if (gender === "Erkek") {
                await member.roles.remove(config_js_1.config.registeredFemaleRoleId).catch(() => undefined);
                await member.roles.add(config_js_1.config.registeredMaleRoleId);
            }
            else {
                await member.roles.remove(config_js_1.config.registeredMaleRoleId).catch(() => undefined);
                await member.roles.add(config_js_1.config.registeredFemaleRoleId);
            }
            await member.setNickname(`✦ ${name} | ${age}`);
            await MemberRecord_js_1.MemberRecord.findOneAndUpdate({ guildId: guild.id, userId: member.id }, {
                $set: { name, age, gender, registered: true, registeredBy: interaction.user.id, registeredAt: new Date(), leftAt: null },
                $inc: { registerCount: 1 }
            }, { upsert: true });
            await RegisterHistory_js_1.RegisterHistory.create({
                guildId: guild.id, userId: member.id, name, age, gender,
                registeredBy: interaction.user.id, action: "register"
            });
            const success = new discord_js_1.EmbedBuilder()
                .setColor(0x2ecc71).setTitle("Kayıt Başarılı")
                .setDescription(`${member} kullanıcısının ismi **${name} | ${age}** olarak değiştirildi.`)
                .addFields({ name: "Eski İsim", value: `\`${oldNickname}\``, inline: true }, { name: "Yeni İsim", value: `\`${name} | ${age}\``, inline: true }, { name: "Cinsiyet", value: gender, inline: true })
                .setFooter({ text: `Kayıt Yetkilisi: ${interaction.user.username}` }).setTimestamp();
            await interaction.update({ embeds: [success], components: [] });
            if (config_js_1.config.registerLogChannelId) {
                const channel = await guild.channels.fetch(config_js_1.config.registerLogChannelId).catch(() => null);
                if (channel?.isTextBased()) {
                    const log = new discord_js_1.EmbedBuilder()
                        .setColor(0x2ecc71).setAuthor({ name: "Kayıt Logu", iconURL: guild.iconURL() ?? undefined })
                        .setDescription(`${member} kullanıcısı kayıt edildi.\n\n**Eski isim:** \`${oldNickname}\`\n**Yeni isim:** \`${name} | ${age}\`\n**Cinsiyet:** \`${gender}\`\n**Kayıt yapan:** ${interaction.user}\n**ID:** \`${member.id}\``).setTimestamp();
                    await channel.send({ embeds: [log] });
                }
            }
        }
        catch (error) {
            console.error("[REGISTER BUTTON]", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "❌ Kayıt yapılırken bir hata oluştu.", ephemeral: true });
            }
        }
        return true;
    }
    if (interaction.customId.startsWith("register_cancel:")) {
        const id = interaction.customId.split(":")[1];
        if (interaction.user.id !== id) {
            await interaction.reply({ content: "❌ Bu paneli yalnızca oluşturan yetkili iptal edebilir.", ephemeral: true });
            return true;
        }
        await interaction.update({ content: "❌ Kayıt işlemi iptal edildi.", embeds: [], components: [] });
        return true;
    }
    return false;
}
