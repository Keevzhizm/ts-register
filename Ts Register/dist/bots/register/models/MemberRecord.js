"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberRecord = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
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
exports.MemberRecord = (0, mongoose_1.model)("MemberRecord", schema);
