import { AuditLogEvent, Client } from "discord.js";
import { config } from "../../../config.js";
import { ModerationRecord } from "../models/ModerationRecord.js";

async function executorFor(guild:any,type:AuditLogEvent,targetId:string){
  const logs=await guild.fetchAuditLogs({type,limit:10});
  return logs.entries.find((x:any)=>x.target?.id===targetId&&Date.now()-x.createdTimestamp<15000)??null;
}
export function startModerationTracker(client:Client){
  client.on("guildBanAdd",async ban=>{try{const e=await executorFor(ban.guild,AuditLogEvent.MemberBanAdd,ban.user.id);if(!e?.executor?.id)return;await ModerationRecord.create({guildId:ban.guild.id,moderatorId:e.executor.id,targetId:ban.user.id,action:"ban",reason:e.reason??null});if(config.moderationLogChannelId){const c=await ban.guild.channels.fetch(config.moderationLogChannelId).catch(()=>null);if(c?.isTextBased())await c.send(`🔨 **Ban**\n**Yetkili:** <@${e.executor.id}>\n**Üye:** <@${ban.user.id}>`)}}catch(err){console.error("[MOD BAN]",err)}});
  client.on("guildBanRemove",async ban=>{try{const e=await executorFor(ban.guild,AuditLogEvent.MemberBanRemove,ban.user.id);if(!e?.executor?.id)return;await ModerationRecord.create({guildId:ban.guild.id,moderatorId:e.executor.id,targetId:ban.user.id,action:"unban",reason:e.reason??null});if(config.moderationLogChannelId){const c=await ban.guild.channels.fetch(config.moderationLogChannelId).catch(()=>null);if(c?.isTextBased())await c.send(`🔓 **Unban**\n**Yetkili:** <@${e.executor.id}>\n**Üye:** <@${ban.user.id}>`)}}catch(err){console.error("[MOD UNBAN]",err)}});
  client.on("guildMemberRemove",async member=>{try{const e=await executorFor(member.guild,AuditLogEvent.MemberKick,member.id);if(!e?.executor?.id)return;await ModerationRecord.create({guildId:member.guild.id,moderatorId:e.executor.id,targetId:member.id,action:"kick",reason:e.reason??null});if(config.moderationLogChannelId){const c=await member.guild.channels.fetch(config.moderationLogChannelId).catch(()=>null);if(c?.isTextBased())await c.send(`👢 **Kick**\n**Yetkili:** <@${e.executor.id}>\n**Üye:** <@${member.id}>`)}}catch(err){console.error("[MOD KICK]",err)}});
}
