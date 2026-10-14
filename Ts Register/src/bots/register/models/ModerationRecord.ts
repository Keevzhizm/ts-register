import { Schema, model } from "mongoose";
const schema = new Schema({
  guildId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true, index: true },
  targetId: { type: String, required: true, index: true },
  action: { type: String, enum: ["ban", "unban", "kick"], required: true, index: true },
  reason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
});
schema.index({ guildId: 1, moderatorId: 1, createdAt: -1 });
export const ModerationRecord = model("ModerationRecord", schema);
