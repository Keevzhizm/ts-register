import { AttachmentBuilder, Client, Guild, TextChannel } from "discord.js";
import { createCanvas } from "canvas";
import { ModerationRecord } from "../models/ModerationRecord.js";
import { config } from "../../../config.js";

const messageIds = new Map<string, string>();
type ActionCounts = { ban: number; kick: number; unban: number };

export async function updateModerationStats(guild: Guild, channel: TextChannel) {
  const rows = await ModerationRecord.aggregate([
    { $match: { guildId: guild.id } },
    { $group: { _id: { moderator: "$moderatorId", action: "$action" }, count: { $sum: 1 } } }
  ]);
  const totals = new Map<string, ActionCounts>();

  for (const row of rows) {
    const moderatorId = String(row._id.moderator);
    const counts = totals.get(moderatorId) ?? { ban: 0, kick: 0, unban: 0 };
    if (row._id.action === "ban" || row._id.action === "kick" || row._id.action === "unban") {
      counts[row._id.action] = row.count;
    }
    totals.set(moderatorId, counts);
  }

  const top = [...totals.entries()]
    .map(([id, counts]) => ({ id, ...counts, total: counts.ban + counts.kick + counts.unban }))
    .sort((left, right) => right.total - left.total)
    .slice(0, 10);

  const canvas = createCanvas(1500, 900);
  const ctx = canvas.getContext("2d");
  const background = ctx.createLinearGradient(0, 0, 1500, 900);
  background.addColorStop(0, "#15112b");
  background.addColorStop(0.5, "#302056");
  background.addColorStop(1, "#11101e");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1500, 900);
  ctx.textAlign = "center";
  ctx.font = "bold 46px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("SHANERIA  /  MODERASYON", 750, 82);
  ctx.font = "19px Arial";
  ctx.fillStyle = "#c4b5fd";
  ctx.fillText("Yetkili işlemlerinin özeti", 750, 120);

  ctx.fillStyle = "rgba(18, 16, 37, 0.9)";
  ctx.strokeStyle = "#a78bfa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(100, 165, 1300, 640, 22);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.font = "bold 19px Arial";
  ctx.fillStyle = "#ddd6fe";
  ctx.fillText("YETKİLİ", 145, 220);
  ctx.fillText("BAN", 820, 220);
  ctx.fillText("KICK", 990, 220);
  ctx.fillText("UNBAN", 1150, 220);
  ctx.fillText("TOPLAM", 1300, 220);

  for (let index = 0; index < top.length; index++) {
    const row = top[index];
    const member = await guild.members.fetch(row.id).catch(() => null);
    const y = 270 + index * 48;
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#a78bfa";
    ctx.fillText("#" + (index + 1), 145, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText((member?.displayName ?? "Üye " + row.id).slice(0, 30), 200, y);
    ctx.fillStyle = "#fca5a5";
    ctx.fillText(String(row.ban), 820, y);
    ctx.fillStyle = "#fdba74";
    ctx.fillText(String(row.kick), 990, y);
    ctx.fillStyle = "#93c5fd";
    ctx.fillText(String(row.unban), 1150, y);
    ctx.fillStyle = "#ddd6fe";
    ctx.font = "bold 18px Arial";
    ctx.fillText(String(row.total), 1300, y);
  }

  if (top.length === 0) {
    ctx.font = "18px Arial";
    ctx.fillStyle = "#bbbbbb";
    ctx.fillText("Henüz moderasyon verisi yok.", 145, 270);
  }
  ctx.textAlign = "center";
  ctx.font = "15px Arial";
  ctx.fillStyle = "#aaa6bd";
  ctx.fillText(
    "Son güncelleme: " + new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
    750,
    860
  );

  const image = new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "shaneria-moderasyon.png"
  });
  const previousId = messageIds.get(guild.id);
  if (previousId) {
    const previous = await channel.messages.fetch(previousId).catch(() => null);
    if (previous) {
      await previous.edit({ files: [image] });
      return;
    }
  }

  const sent = await channel.send({ files: [image] });
  messageIds.set(guild.id, sent.id);
}

export function startModerationStats(client: Client) {
  if (!config.moderationStatsChannelId) return;
  let updating = false;

  const update = async () => {
    if (updating) return;
    updating = true;
    try {
      const channel = await client.channels.fetch(config.moderationStatsChannelId);
      if (channel?.isTextBased() && "guild" in channel && channel.guild) {
        await updateModerationStats(channel.guild, channel as TextChannel);
      }
    } catch (error) {
      console.error("[MODERATION STATS]", error);
    } finally {
      updating = false;
    }
  };

  void update();
  setInterval(() => void update(), config.statsUpdateIntervalMs);
}
