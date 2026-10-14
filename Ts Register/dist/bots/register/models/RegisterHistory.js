"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterHistory = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
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
exports.RegisterHistory = (0, mongoose_1.model)("RegisterHistory", schema);
