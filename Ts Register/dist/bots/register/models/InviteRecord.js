"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteRecord = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    guildId: { type: String, required: true, index: true },
    code: { type: String, required: true },
    inviterId: { type: String, default: null, index: true },
    uses: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
schema.index({ guildId: 1, code: 1 }, { unique: true });
exports.InviteRecord = (0, mongoose_1.model)("InviteRecord", schema);
