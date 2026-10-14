"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const mongoose_1 = __importDefault(require("mongoose"));
const index_js_1 = require("./bots/register/index.js");
if (!process.env.TOKEN)
    throw new Error("TOKEN .env içinde bulunamadı.");
if (!process.env.MONGO_URI)
    throw new Error("MONGO_URI .env içinde bulunamadı.");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildInvites,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildModeration
    ],
    partials: [discord_js_1.Partials.Channel]
});
client.once("ready", () => {
    console.log(`🤖 Bot aktif: ${client.user?.tag}`);
    client.user?.setPresence({
        activities: [{ name: "Shaneria Register Bot", type: 1, url: "" }],
        status: "online"
    });
});
async function bootstrap() {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("🟢 MongoDB bağlantısı başarılı.");
        (0, index_js_1.startRegisterBot)(client);
        await client.login(process.env.TOKEN);
    }
    catch (error) {
        console.error("🔴 Bot başlatılamadı:", error);
        process.exit(1);
    }
}
void bootstrap();
