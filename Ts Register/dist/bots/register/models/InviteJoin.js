"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteJoin = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    guildId: { type: String, required: true, index: true },
    invitedUserId: { type: String, required: true, index: true },
    inviterId: { type: String, default: null, index: true },
    code: { type: String, default: null },
    joinedAt: { type: Date, default: Date.now, index: true },
    leftAt: { type: Date, default: null, index: true }
});
schema.index({ guildId: 1, invitedUserId: 1 }, { unique: true });
schema.index({ guildId: 1, inviterId: 1, joinedAt: -1 });
exports.InviteJoin = (0, mongoose_1.model)("InviteJoin", schema);
