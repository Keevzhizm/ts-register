import { AttachmentBuilder, Client, Guild, TextChannel } from "discord.js";
import { createCanvas } from "canvas";
import { RegisterHistory } from "../models/RegisterHistory.js";
import { InviteJoin } from "../models/InviteJoin.js";
import { config } from "../../../config.js";

const messageIds = new Map<string, string>();

type LeaderRow = { _id: string; count: number };

export async function updateLeaderboard(guild: Guild, channel: TextChannel) {
  const [registers, invites] = await Promise.all([
    RegisterHistory.aggregate([
      { $match: { guildId: guild.id, action: { $in: ["register", "auto-register"] } } },
      { $group: { _id: "$registeredBy", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    InviteJoin.aggregate([
      { $match: { guildId: guild.id, inviterId: { $ne: null } } },
      { $group: { _id: "$inviterId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  const canvas = createCanvas(1500, 900);
  const ctx = canvas.getContext("2d");
  const background = ctx.createLinearGradient(0, 0, 1500, 900);
  background.addColorStop(0, "#11162b");
  background.addColorStop(0.55, "#28152f");
  background.addColorStop(1, "#101426");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1500, 900);

  ctx.textAlign = "center";
  ctx.font = "bold 46px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("SHANERIA  /  TOP LİSTELER", 750, 82);
  ctx.font = "19px Arial";
  ctx.fillStyle = "#b9b4d2";
  ctx.fillText(guild.name, 750, 120);

  const panels = [
    { title: "KAYIT EKİBİ", x: 55, color: "#ff758f", rows: registers as LeaderRow[] },
    { title: "DAVET EKİBİ", x: 765, color: "#8ca8ff", rows: invites as LeaderRow[] }
  ];

  for (const panel of panels) {
    ctx.fillStyle = "rgba(13, 16, 34, 0.86)";
    ctx.strokeStyle = panel.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panel.x, 160, 680, 650, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(panel.title, panel.x + 30, 210);

    for (let index = 0; index < panel.rows.length; index++) {
      const row = panel.rows[index];
      const member = await guild.members.fetch(row._id).catch(() => null);
      const y = 265 + index * 50;
      const displayName = (member?.displayName ?? "Üye " + row._id)
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .slice(0, 28);

      ctx.font = "bold 18px Arial";
      ctx.fillStyle = panel.color;
      ctx.fillText(String(index + 1).padStart(2, "0"), panel.x + 32, y);
      ctx.font = "18px Arial";
      ctx.fillStyle = "#f4f2ff";
      ctx.fillText(displayName, panel.x + 90, y);
      ctx.textAlign = "right";
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = panel.color;
      ctx.fillText(String(row.count), panel.x + 640, y);
      ctx.textAlign = "left";
    }

    if (panel.rows.length === 0) {
      ctx.font = "18px Arial";
      ctx.fillStyle = "#aaa6bd";
      ctx.fillText("Henüz veri bulunmuyor.", panel.x + 30, 270);
    }
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
    name: "shaneria-leaderboard.png"
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

export function startLeaderboard(client: Client, channelId?: string) {
  if (!channelId) return;
  let updating = false;

  const update = async () => {
    if (updating) return;
    updating = true;
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel?.isTextBased() && "guild" in channel && channel.guild) {
        await updateLeaderboard(channel.guild, channel as TextChannel);
      }
    } catch (error) {
      console.error("[LEADERBOARD]", error);
    } finally {
      updating = false;
    }
  };

  void update();
  setInterval(() => void update(), config.statsUpdateIntervalMs);
}
