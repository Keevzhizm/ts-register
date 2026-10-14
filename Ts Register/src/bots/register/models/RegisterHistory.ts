import { Schema, model } from "mongoose";
const schema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  registeredBy: { type: String, required: true, index: true },
  action: { type: String, enum: ["register", "unregister", "auto-register"], required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});
schema.index({ guildId: 1, registeredBy: 1, action: 1, createdAt: -1 });
export const RegisterHistory = model("RegisterHistory", schema);
