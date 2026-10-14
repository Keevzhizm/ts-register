"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRegisterBot = startRegisterBot;
const config_js_1 = require("../../config.js");
const MemberRecord_js_1 = require("./models/MemberRecord.js");
const RegisterHistory_js_1 = require("./models/RegisterHistory.js");
const register_js_1 = require("./commands/register.js");
const unregister_js_1 = require("./commands/unregister.js");
const history_js_1 = require("./commands/history.js");
const modstats_js_1 = require("./commands/modstats.js");
const inviteSystem_js_1 = require("./systems/inviteSystem.js");
const welcomeSystem_js_1 = require("./systems/welcomeSystem.js");
const leaderboardSystem_js_1 = require("./systems/leaderboardSystem.js");
const registerStatsSystem_js_1 = require("./systems/registerStatsSystem.js");
const inviteStatsSystem_js_1 = require("./systems/inviteStatsSystem.js");
const moderationStatsSystem_js_1 = require("./systems/moderationStatsSystem.js");
const moderationTracker_js_1 = require("./systems/moderationTracker.js");
const inviteCache = new Map();
function startRegisterBot(client) {
    client.once("ready", async () => {
        const guild = client.guilds.cache.get(config_js_1.config.guildId);
        if (!guild) {
            console.error("🔴 Config guildId ile sunucu bulunamadı.");
            return;
        }
        await (0, inviteSystem_js_1.cacheGuildInvites)(guild, inviteCache);
        console.log(`📨 Invite sistemi hazır: ${guild.name}`);
        const voiceChannel = guild.channels.cache.get(config_js_1.config.voiceChannelId);
        if (voiceChannel?.isVoiceBased()) {
            try {
                const { joinVoiceChannel } = await import("@discordjs/voice");
                joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator
                });
                console.log(`🔊 Ses kanalına bağlandı: ${voiceChannel.name}`);
            }
            catch (error) {
                console.error("[VOICE]", error);
            }
        }
        (0, leaderboardSystem_js_1.startLeaderboard)(client, config_js_1.config.leaderboardChannelId);
        (0, registerStatsSystem_js_1.startRegisterStats)(client);
        (0, inviteStatsSystem_js_1.startInviteStats)(client);
        (0, moderationStatsSystem_js_1.startModerationStats)(client);
        (0, moderationTracker_js_1.startModerationTracker)(client);
        console.log("🟢 Register bot sistemleri başlatıldı.");
    });
    client.on("inviteCreate", async (invite) => {
        try {
            await (0, inviteSystem_js_1.handleInviteCreate)(invite);
            await (0, inviteSystem_js_1.cacheGuildInvites)(invite.guild, inviteCache);
        }
        catch (error) {
            console.error("[INVITE CREATE]", error);
        }
    });
    client.on("guildMemberAdd", async (member) => {
        try {
            const oldRecord = await MemberRecord_js_1.MemberRecord.findOne({
                guildId: member.guild.id,
                userId: member.id
            });
            if (!oldRecord?.registered || !oldRecord.name || !oldRecord.age || !oldRecord.gender) {
                await member.setNickname("✦ İsim | Yaş").catch(error => console.error("[UNREGISTERED NICKNAME]", error));
            }
            else {
                await member.setNickname(`✦ ${oldRecord.name} | ${oldRecord.age}`).catch(() => undefined);
                await member.roles.remove(config_js_1.config.unregisteredRoleId, "Otomatik kayıt").catch(() => undefined);
                if (oldRecord.gender === "Erkek") {
                    await member.roles.remove(config_js_1.config.registeredFemaleRoleId).catch(() => undefined);
                    await member.roles.add(config_js_1.config.registeredMaleRoleId, "Otomatik kayıt").catch(() => undefined);
                }
                else if (oldRecord.gender === "Kadın") {
                    await member.roles.remove(config_js_1.config.registeredMaleRoleId).catch(() => undefined);
                    await member.roles.add(config_js_1.config.registeredFemaleRoleId, "Otomatik kayıt").catch(() => undefined);
                }
                await RegisterHistory_js_1.RegisterHistory.create({
                    guildId: member.guild.id,
                    userId: member.id,
                    name: oldRecord.name,
                    age: oldRecord.age,
                    gender: oldRecord.gender,
                    registeredBy: oldRecord.registeredBy ?? client.user?.id ?? "0",
                    action: "auto-register"
                });
                await MemberRecord_js_1.MemberRecord.findOneAndUpdate({ guildId: member.guild.id, userId: member.id }, {
                    $set: { registered: true, registeredAt: new Date(), leftAt: null },
                    $inc: { registerCount: 1 }
                });
            }
            await (0, inviteSystem_js_1.handleMemberJoin)(member, inviteCache, guildToRefresh => (0, inviteSystem_js_1.cacheGuildInvites)(guildToRefresh, inviteCache));
        }
        catch (error) {
            console.error("[MEMBER JOIN]", error);
        }
    });
    client.on("guildMemberRemove", async (member) => {
        try {
            await (0, inviteSystem_js_1.handleMemberLeave)(member);
        }
        catch (error) {
            console.error("[MEMBER REMOVE]", error);
        }
    });
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton())
            return;
        if (await (0, register_js_1.handleRegisterButton)(interaction))
            return;
        if (!interaction.customId.startsWith("register_call:"))
            return;
        const targetUserId = interaction.customId.split(":")[1];
        if (interaction.user.id !== targetUserId) {
            await interaction.reply({
                content: "❌ Bu butonu yalnızca sunucuya yeni gelen kullanıcı kullanabilir.",
                ephemeral: true
            });
            return;
        }
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        if (!member) {
            await interaction.reply({ content: "❌ Kullanıcı bilgilerin bulunamadı.", ephemeral: true });
            return;
        }
        if (member.voice.channelId) {
            await interaction.reply({
                content: "🔊 Ses kanalından çıktıktan sonra kayıt yetkilisini çağırabilirsin.",
                ephemeral: true
            });
            return;
        }
        const channel = interaction.channel;
        if (!channel?.isTextBased() || !("send" in channel)) {
            await interaction.reply({
                content: "❌ Bu kanalda işlem gerçekleştirilemiyor.",
                ephemeral: true
            });
            return;
        }
        const call = (0, welcomeSystem_js_1.buildRegisterCallMessage)(member);
        const callMessage = await channel.send({
            content: call.content,
            allowedMentions: {
                users: [member.id],
                roles: call.roleIds
            }
        });
        setTimeout(async () => {
            await callMessage.delete().catch(() => undefined);
        }, 120_000);
        await interaction.reply({
            content: "✅ Kayıt yetkililerine haber verildi.",
            ephemeral: true
        });
    });
    client.on("messageCreate", async (message) => {
        if (message.author.bot || !message.guild)
            return;
        if (!message.content.startsWith(config_js_1.config.prefix))
            return;
        const args = message.content
            .slice(config_js_1.config.prefix.length)
            .trim()
            .split(/\s+/);
        const command = (args.shift() ?? "").toLocaleLowerCase("tr-TR");
        if (!command)
            return;
        try {
            switch (command) {
                case "kayıt":
                case "kayit":
                    await (0, register_js_1.registerCommand)(message, args);
                    break;
                case "kayıtsız":
                case "kayitsiz":
                    await (0, unregister_js_1.unregisterCommand)(message, args);
                    break;
                case "isimler":
                case "isim":
                    await (0, history_js_1.historyCommand)(message);
                    break;
                case "modstat":
                case "moderasyon":
                    await (0, modstats_js_1.moderationStatsCommand)(message, args);
                    break;
            }
        }
        catch (error) {
            console.error(`[COMMAND] ${command}`, error);
            if (!message.replied && !message.deferred) {
                await message.reply("❌ Komut çalıştırılırken bir hata oluştu.").catch(() => undefined);
            }
        }
    });
}
