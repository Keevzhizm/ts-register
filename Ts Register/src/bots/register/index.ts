import { Client, TextChannel } from "discord.js";
import { config } from "../../config.js";
import { MemberRecord } from "./models/MemberRecord.js";
import { RegisterHistory } from "./models/RegisterHistory.js";
import { registerCommand, handleRegisterButton } from "./commands/register.js";
import { unregisterCommand } from "./commands/unregister.js";
import { historyCommand } from "./commands/history.js";
import { moderationStatsCommand } from "./commands/modstats.js";
import { cacheGuildInvites, handleInviteCreate, handleMemberJoin, handleMemberLeave } from "./systems/inviteSystem.js";
import { buildRegisterCallMessage } from "./systems/welcomeSystem.js";
import { startLeaderboard } from "./systems/leaderboardSystem.js";
import { startRegisterStats } from "./systems/registerStatsSystem.js";
import { startInviteStats } from "./systems/inviteStatsSystem.js";
import { startModerationStats } from "./systems/moderationStatsSystem.js";
import { startModerationTracker } from "./systems/moderationTracker.js";
import { silCommand } from "./commands/sil.js";

const inviteCache = new Map<string, Map<string, number>>();

export function startRegisterBot(client: Client) {
  client.once("ready", async () => {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
      console.error("🔴 Config guildId ile sunucu bulunamadı.");
      return;
    }

    await cacheGuildInvites(guild, inviteCache);
    console.log(`📨 Invite sistemi hazır: ${guild.name}`);

    const voiceChannel = guild.channels.cache.get(config.voiceChannelId);
    if (voiceChannel?.isVoiceBased()) {
      try {
        const { joinVoiceChannel } = await import("@discordjs/voice");
        joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator
        });
        console.log(`🔊 Ses kanalına bağlandı: ${voiceChannel.name}`);
      } catch (error) {
        console.error("[VOICE]", error);
      }
    }

    startLeaderboard(client, config.leaderboardChannelId);
    startRegisterStats(client);
    startInviteStats(client);
    startModerationStats(client);
    startModerationTracker(client);

    console.log("🟢 Register bot sistemleri başlatıldı.");
  });

  client.on("inviteCreate", async invite => {
    try {
      await handleInviteCreate(invite);
      await cacheGuildInvites(invite.guild, inviteCache);
    } catch (error) {
      console.error("[INVITE CREATE]", error);
    }
  });

  client.on("guildMemberAdd", async member => {
    try {
      const oldRecord = await MemberRecord.findOne({
        guildId: member.guild.id,
        userId: member.id
      });

      if (!oldRecord?.registered || !oldRecord.name || !oldRecord.age || !oldRecord.gender) {
        await member.setNickname("✦ İsim | Yaş").catch(error =>
          console.error("[UNREGISTERED NICKNAME]", error)
        );
      } else {
        await member.setNickname(`✦ ${oldRecord.name} | ${oldRecord.age}`).catch(() => undefined);

        await member.roles.remove(config.unregisteredRoleId, "Otomatik kayıt").catch(() => undefined);

        if (oldRecord.gender === "Erkek") {
          await member.roles.remove(config.registeredFemaleRoleId).catch(() => undefined);
          await member.roles.add(config.registeredMaleRoleId, "Otomatik kayıt").catch(() => undefined);
        } else if (oldRecord.gender === "Kadın") {
          await member.roles.remove(config.registeredMaleRoleId).catch(() => undefined);
          await member.roles.add(config.registeredFemaleRoleId, "Otomatik kayıt").catch(() => undefined);
        }

        await RegisterHistory.create({
          guildId: member.guild.id,
          userId: member.id,
          name: oldRecord.name,
          age: oldRecord.age,
          gender: oldRecord.gender,
          registeredBy: oldRecord.registeredBy ?? client.user?.id ?? "0",
          action: "auto-register"
        });

        await MemberRecord.findOneAndUpdate(
          { guildId: member.guild.id, userId: member.id },
          {
            $set: { registered: true, registeredAt: new Date(), leftAt: null },
            $inc: { registerCount: 1 }
          }
        );
      }

      await handleMemberJoin(
        member,
        inviteCache,
        guildToRefresh => cacheGuildInvites(guildToRefresh, inviteCache)
      );
    } catch (error) {
      console.error("[MEMBER JOIN]", error);
    }
  });

  client.on("guildMemberRemove", async member => {
    try {
      await handleMemberLeave(member);
    } catch (error) {
      console.error("[MEMBER REMOVE]", error);
    }
  });

  client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (await handleRegisterButton(interaction)) return;
    if (!interaction.customId.startsWith("register_call:")) return;

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

    const call = buildRegisterCallMessage(member);
    const callMessage = await (channel as TextChannel).send({
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

  client.on("messageCreate", async message => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content
      .slice(config.prefix.length)
      .trim()
      .split(/\s+/);

    const command = (args.shift() ?? "").toLocaleLowerCase("tr-TR");
    if (!command) return;

    try {
      switch (command) {
        case "kayıt":
        case "kayit":
          await registerCommand(message, args);
          break;

        case "kayıtsız":
        case "kayitsiz":
          await unregisterCommand(message, args);
          break;

        case "isimler":
        case "isim":
          await historyCommand(message);
          break;

        case "modstat":
        case "moderasyon":
          await moderationStatsCommand(message, args);
          break;

        case "sil":
          await silCommand(message, args);
          break;
      }
    } catch (error) {
      console.error(`[COMMAND] ${command}`, error);
      if (!message.replied && !message.deferred) {
        await message.reply("❌ Komut çalıştırılırken bir hata oluştu.").catch(() => undefined);
      }
    }
  });
}
