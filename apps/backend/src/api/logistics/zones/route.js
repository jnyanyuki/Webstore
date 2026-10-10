"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const types_1 = require("@webstore/types");
async function GET(req, res) {
    try {
        return res.status(200).json({
            success: true,
            zones: Object.keys(types_1.NAIROBI_LANDMARKS),
            landmarks: types_1.NAIROBI_LANDMARKS,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "Failed to fetch delivery zones" });
    }
}
