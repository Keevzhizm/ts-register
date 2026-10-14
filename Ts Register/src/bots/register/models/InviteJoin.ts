import { Schema, model } from "mongoose";
const schema = new Schema({
  guildId: { type: String, required: true, index: true },
  invitedUserId: { type: String, required: true, index: true },
  inviterId: { type: String, default: null, index: true },
  code: { type: String, default: null },
  joinedAt: { type: Date, default: Date.now, index: true },
  leftAt: { type: Date, default: null, index: true }
});
schema.index({ guildId: 1, invitedUserId: 1 }, { unique: true });
schema.index({ guildId: 1, inviterId: 1, joinedAt: -1 });
export const InviteJoin = model("InviteJoin", schema);
