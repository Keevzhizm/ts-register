import { AttachmentBuilder, Client, Guild, TextChannel } from "discord.js";
import { createCanvas } from "canvas";
import { RegisterHistory } from "../models/RegisterHistory.js";
import { config } from "../../../config.js";
const messages=new Map<string,string>();
const clean=(s:string)=>s.replace(/[♛✦★☆♦◆⚡]/gu,"").replace(/[\u0000-\u001F\u007F]/g,"").trim();
export async function updateRegisterStats(guild:Guild,channel:TextChannel){
  const rows=await RegisterHistory.find({guildId:guild.id,action:{$in:["register","auto-register"]}}).lean();
  const now=Date.now(), staff=new Map<string,number>(); let male=0,female=0,today=0,week=0;
  for(const r of rows){if(r.gender==="Erkek")male++;if(r.gender==="Kadın")female++;const t=new Date(r.createdAt).getTime();if(t>=now-86400000)today++;if(t>=now-604800000)week++;staff.set(r.registeredBy,(staff.get(r.registeredBy)??0)+1)}
  const top=[...staff.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  const canvas=createCanvas(1600,900),ctx=canvas.getContext("2d"),bg=ctx.createLinearGradient(0,0,1600,900);
  bg.addColorStop(0,"#071a18");bg.addColorStop(.5,"#0c3a34");bg.addColorStop(1,"#03110f");ctx.fillStyle=bg;ctx.fillRect(0,0,1600,900);
  ctx.textAlign="center";ctx.font="bold 58px Arial";ctx.fillStyle="#fff";ctx.fillText("SHANERİA • KAYIT İSTATİSTİKLERİ",800,80);ctx.font="20px Arial";ctx.fillStyle="#9ee8d9";ctx.fillText("Kayıt performansı ve genel kayıt durumu",800,120);
  const cards=[["TOPLAM KAYIT",rows.length],["SON 24 SAAT",today],["SON 7 GÜN",week],["ERKEK",male],["KADIN",female]];
  cards.forEach(([t,v],i)=>{const x=60+i*305;ctx.fillStyle="rgba(6,31,28,.88)";ctx.strokeStyle="#39d9bd";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,165,275,125,18);ctx.fill();ctx.stroke();ctx.textAlign="left";ctx.font="bold 17px Arial";ctx.fillStyle="#8bded0";ctx.fillText(String(t),x+22,205);ctx.font="bold 40px Arial";ctx.fillStyle="#fff";ctx.fillText(String(v),x+22,260)});
  ctx.fillStyle="rgba(6,31,28,.92)";ctx.strokeStyle="#39d9bd";ctx.beginPath();ctx.roundRect(60,330,1480,485,22);ctx.fill();ctx.stroke();ctx.textAlign="left";ctx.font="bold 30px Arial";ctx.fillStyle="#fff";ctx.fillText("EN ÇOK KAYIT YAPAN YETKİLİLER",95,380);
  for(let i=0;i<top.length;i++){const [id,count]=top[i],y=430+i*45,m=await guild.members.fetch(id).catch(()=>null);ctx.font="bold 21px Arial";ctx.fillStyle="#69e2cc";ctx.fillText(`#${i+1}`,100,y);ctx.fillStyle="#fff";ctx.font="20px Arial";ctx.fillText(clean(m?.user.globalName??m?.user.username??`Kullanıcı ${id}`).slice(0,35),175,y);ctx.textAlign="right";ctx.font="bold 21px Arial";ctx.fillStyle="#39d9bd";ctx.fillText(`${count} kayıt`,1470,y);ctx.textAlign="left"}
  ctx.textAlign="center";ctx.font="17px Arial";ctx.fillStyle="#7eb8af";ctx.fillText(`Son güncelleme: ${new Date().toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"})}`,800,860);
  const a=new AttachmentBuilder(canvas.toBuffer("image/png"),{name:"register-stats.png"}),oldId=messages.get(guild.id);
  if(oldId){const old=await channel.messages.fetch(oldId).catch(()=>null);if(old){await old.edit({content:"",files:[a]});return}} const msg=await channel.send({files:[a]});messages.set(guild.id,msg.id);
}
export function startRegisterStats(client:Client){if(!config.registerStatsChannelId)return;let busy=false;const update=async()=>{if(busy)return;busy=true;try{const c=await client.channels.fetch(config.registerStatsChannelId);if(c?.isTextBased()&&"guild"in c&&c.guild)await updateRegisterStats(c.guild,c as TextChannel)}catch(e){console.error("[REGISTER STATS]",e)}finally{busy=false}};void update();setInterval(()=>void update(),config.statsUpdateIntervalMs)}
