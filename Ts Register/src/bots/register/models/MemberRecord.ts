import { Schema, model } from "mongoose";
const schema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, default: null },
  age: { type: Number, default: null },
  gender: { type: String, default: null },
  registered: { type: Boolean, default: false },
  registeredBy: { type: String, default: null },
  registeredAt: { type: Date, default: null },
  leftAt: { type: Date, default: null },
  registerCount: { type: Number, default: 0 }
}, { timestamps: true });
schema.index({ guildId: 1, userId: 1 }, { unique: true });
export const MemberRecord = model("MemberRecord", schema);
