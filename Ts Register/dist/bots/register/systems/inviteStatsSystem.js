"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInviteStats = updateInviteStats;
exports.startInviteStats = startInviteStats;
const discord_js_1 = require("discord.js");
const canvas_1 = require("canvas");
const InviteJoin_js_1 = require("../models/InviteJoin.js");
const config_js_1 = require("../../../config.js");
const messages = new Map();
const clean = (s) => s.replace(/[♛✦★☆♦◆⚡]/gu, "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
async function updateInviteStats(guild, channel) {
    const rows = await InviteJoin_js_1.InviteJoin.find({ guildId: guild.id }).lean(), map = new Map();
    for (const r of rows) {
        if (!r.inviterId)
            continue;
        const x = map.get(r.inviterId) ?? { invited: 0, left: 0 };
        x.invited++;
        if (r.leftAt)
            x.left++;
        map.set(r.inviterId, x);
    }
    const top = [...map.entries()].map(([userId, x]) => ({ userId, ...x, net: x.invited - x.left })).sort((a, b) => b.net - a.net).slice(0, 10);
    const invited = rows.filter(x => !!x.inviterId).length, left = rows.filter(x => !!x.inviterId && !!x.leftAt).length;
    const canvas = (0, canvas_1.createCanvas)(1600, 900), ctx = canvas.getContext("2d"), bg = ctx.createLinearGradient(0, 0, 1600, 900);
    bg.addColorStop(0, "#061225");
    bg.addColorStop(.5, "#102b55");
    bg.addColorStop(1, "#050b16");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1600, 900);
    ctx.textAlign = "center";
    ctx.font = "bold 58px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("SHANERİA • INVITE İSTATİSTİKLERİ", 800, 80);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#a8c9ff";
    ctx.fillText("Davet edilen, ayrılan ve net davet performansı", 800, 120);
    [["DAVET EDİLEN", invited], ["AYRILAN", left], ["NET", invited - left]].forEach(([t, v], i) => { const x = 145 + i * 445; ctx.fillStyle = "rgba(5,22,44,.9)"; ctx.strokeStyle = "#4f8cff"; ctx.beginPath(); ctx.roundRect(x, 165, 390, 125, 18); ctx.fill(); ctx.stroke(); ctx.textAlign = "left"; ctx.font = "bold 18px Arial"; ctx.fillStyle = "#9bbcff"; ctx.fillText(String(t), x + 25, 205); ctx.font = "bold 42px Arial"; ctx.fillStyle = "#fff"; ctx.fillText(String(v), x + 25, 260); });
    ctx.fillStyle = "rgba(5,22,44,.94)";
    ctx.strokeStyle = "#4f8cff";
    ctx.beginPath();
    ctx.roundRect(70, 330, 1460, 485, 22);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("EN ÇOK NET DAVET GETİREN ÜYELER", 105, 380);
    for (let i = 0; i < top.length; i++) {
        const x = top[i], y = 430 + i * 36, m = await guild.members.fetch(x.userId).catch(() => null);
        ctx.font = "bold 19px Arial";
        ctx.fillStyle = "#70a6ff";
        ctx.fillText(`#${i + 1}`, 110, y);
        ctx.fillStyle = "#fff";
        ctx.font = "18px Arial";
        ctx.fillText(clean(m?.user.globalName ?? m?.user.username ?? `Kullanıcı ${x.userId}`).slice(0, 32), 175, y);
        ctx.fillStyle = "#a8c9ff";
        ctx.fillText(`+${x.invited}`, 900, y);
        ctx.fillStyle = "#ff8493";
        ctx.fillText(`-${x.left}`, 1060, y);
        ctx.textAlign = "right";
        ctx.font = "bold 19px Arial";
        ctx.fillStyle = "#4f8cff";
        ctx.fillText(`NET ${x.net}`, 1460, y);
        ctx.textAlign = "left";
    }
    ctx.textAlign = "center";
    ctx.font = "17px Arial";
    ctx.fillStyle = "#7895bd";
    ctx.fillText(`Son güncelleme: ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`, 800, 860);
    const a = new discord_js_1.AttachmentBuilder(canvas.toBuffer("image/png"), { name: "invite-stats.png" }), oldId = messages.get(guild.id);
    if (oldId) {
        const old = await channel.messages.fetch(oldId).catch(() => null);
        if (old) {
            await old.edit({ content: "", files: [a] });
            return;
        }
    }
    const msg = await channel.send({ files: [a] });
    messages.set(guild.id, msg.id);
}
function startInviteStats(client) { if (!config_js_1.config.inviteStatsChannelId)
    return; let busy = false; const update = async () => { if (busy)
    return; busy = true; try {
    const c = await client.channels.fetch(config_js_1.config.inviteStatsChannelId);
    if (c?.isTextBased() && "guild" in c && c.guild)
        await updateInviteStats(c.guild, c);
}
catch (e) {
    console.error("[INVITE STATS]", e);
}
finally {
    busy = false;
} }; void update(); setInterval(() => void update(), config_js_1.config.statsUpdateIntervalMs); }
