import "dotenv/config";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import mongoose from "mongoose";
import { startRegisterBot } from "./bots/register/index.js";
import { validateConfig } from "./config.js";

if (!process.env.DISCORD_TOKEN) throw new Error("DISCORD_TOKEN .env içinde bulunamadı.");
if (!process.env.MONGO_URI) throw new Error("MONGO_URI .env içinde bulunamadı.");
if (!/^mongodb(?:\+srv)?:\/\//i.test(process.env.MONGO_URI)) {
  throw new Error("MONGO_URI mongodb:// veya mongodb+srv:// ile başlamalı.");
}
validateConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`🤖 Bot aktif: ${client.user?.tag}`);
  client.user?.setPresence({
    activities: [{ name: "Shaneria • Topluluk", type: 0 }],
    status: "online"
  });
});

async function bootstrap() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("🟢 MongoDB bağlantısı başarılı.");
    startRegisterBot(client);
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("🔴 Bot başlatılamadı:", error);
    process.exit(1);
  }
}

void bootstrap();
