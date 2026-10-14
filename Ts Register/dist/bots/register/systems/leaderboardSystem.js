"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaderboard = updateLeaderboard;
exports.startLeaderboard = startLeaderboard;
const discord_js_1 = require("discord.js");
const canvas_1 = require("canvas");
const RegisterHistory_js_1 = require("../models/RegisterHistory.js");
const InviteJoin_js_1 = require("../models/InviteJoin.js");
const messages = new Map();
const clean = (s) => s.replace(/[♛✦★☆♦◆⚡]/gu, "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
async function updateLeaderboard(guild, channel) {
    const regs = await RegisterHistory_js_1.RegisterHistory.find({ guildId: guild.id, action: { $in: ["register", "auto-register"] } }).lean();
    const invs = await InviteJoin_js_1.InviteJoin.find({ guildId: guild.id }).lean();
    const rm = new Map(), im = new Map();
    for (const r of regs)
        rm.set(r.registeredBy, (rm.get(r.registeredBy) ?? 0) + 1);
    for (const r of invs)
        if (r.inviterId)
            im.set(r.inviterId, (im.get(r.inviterId) ?? 0) + 1);
    const panels = [
        { x: 55, title: "KAYIT SIRALAMASI", rows: [...rm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10) },
        { x: 815, title: "INVITE SIRALAMASI", rows: [...im.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10) }
    ];
    const canvas = (0, canvas_1.createCanvas)(1600, 900), ctx = canvas.getContext("2d");
    const bg = ctx.createLinearGradient(0, 0, 1600, 900);
    bg.addColorStop(0, "#120006");
    bg.addColorStop(.5, "#3d000e");
    bg.addColorStop(1, "#120006");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1600, 900);
    ctx.textAlign = "center";
    ctx.font = "bold 62px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("SHANERİA", 800, 90);
    for (const p of panels) {
        ctx.fillStyle = "rgba(13,2,5,.9)";
        ctx.strokeStyle = "#ff304d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(p.x, 170, 730, 650, 22);
        ctx.fill();
        ctx.stroke();
        ctx.font = "bold 30px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText(p.title, p.x + 365, 220);
        for (let i = 0; i < p.rows.length; i++) {
            const [id, count] = p.rows[i], y = 275 + i * 50;
            const m = await guild.members.fetch(id).catch(() => null);
            ctx.textAlign = "left";
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "#ff5268";
            ctx.fillText(`#${i + 1}`, p.x + 35, y);
            ctx.fillStyle = "#fff";
            ctx.font = "19px Arial";
            ctx.fillText(clean(m?.user.globalName ?? m?.user.username ?? `Kullanıcı ${id}`).slice(0, 35), p.x + 100, y);
            ctx.textAlign = "right";
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "#ff5268";
            ctx.fillText(String(count), p.x + 690, y);
        }
    }
    ctx.textAlign = "center";
    ctx.font = "17px Arial";
    ctx.fillStyle = "#b89098";
    ctx.fillText(`Son güncelleme: ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`, 800, 860);
    const attachment = new discord_js_1.AttachmentBuilder(canvas.toBuffer("image/png"), { name: "leaderboard.png" }), oldId = messages.get(guild.id);
    if (oldId) {
        const old = await channel.messages.fetch(oldId).catch(() => null);
        if (old) {
            await old.edit({ content: "", files: [attachment] });
            return;
        }
    }
    const msg = await channel.send({ files: [attachment] });
    messages.set(guild.id, msg.id);
}
function startLeaderboard(client, channelId) {
    if (!channelId)
        return;
    let busy = false;
    const update = async () => { if (busy)
        return; busy = true; try {
        const c = await client.channels.fetch(channelId);
        if (c?.isTextBased() && "guild" in c && c.guild)
            await updateLeaderboard(c.guild, c);
    }
    catch (e) {
        console.error("[LEADERBOARD]", e);
    }
    finally {
        busy = false;
    } };
    void update();
    setInterval(() => void update(), 30000);
}
