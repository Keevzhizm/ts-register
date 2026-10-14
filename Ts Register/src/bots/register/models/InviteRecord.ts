import { Schema, model } from "mongoose";
const schema = new Schema({
  guildId: { type: String, required: true, index: true },
  code: { type: String, required: true },
  inviterId: { type: String, default: null, index: true },
  uses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
schema.index({ guildId: 1, code: 1 }, { unique: true });
export const InviteRecord = model("InviteRecord", schema);
