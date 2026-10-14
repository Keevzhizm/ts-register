import { EmbedBuilder, Message } from "discord.js";
import { config } from "../../../config.js";
import { ModerationRecord } from "../models/ModerationRecord.js";
export async function moderationStatsCommand(message: Message, args: string[]) {
 if (!message.guild) return;
 const id = message.mentions.users.first()?.id ?? args[0] ?? message.author.id;
 if (!/^\d{17,20}$/.test(id)) return void await message.reply("❌ Geçerli kullanıcı etiketi veya ID gir.");
 const rows = await ModerationRecord.aggregate([{ $match: { guildId: message.guild.id, moderatorId: id } }, { $group: { _id: "$action", count: { $sum: 1 } } }]);
 const counts = new Map(rows.map(r => [String(r._id), Number(r.count)]));
 const total = [...counts.values()].reduce((a,b)=>a+b,0);
 const member = await message.guild.members.fetch(id).catch(()=>null);
 const embed = new EmbedBuilder().setColor(config.colors.moderation).setTitle("Moderasyon İstatistikleri").setDescription((member ?? "<@"+id+">")+" için kayıtlı işlemler")
 .addFields({name:"Toplam",value:"**"+total+"**",inline:true},{name:"Ban",value:"**"+(counts.get("ban")??0)+"**",inline:true},{name:"Kick",value:"**"+(counts.get("kick")??0)+"**",inline:true},{name:"Unban",value:"**"+(counts.get("unban")??0)+"**",inline:true}).setTimestamp();
 await message.reply({embeds:[embed],allowedMentions:{users:[]}});
}
