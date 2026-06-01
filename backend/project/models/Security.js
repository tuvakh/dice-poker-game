import mongoose from "mongoose";

const securitySchema = new mongoose.Schema({
    type: { type: String, required: true },
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
});

export const Security = mongoose.model('Security', securitySchema);
