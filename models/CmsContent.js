import mongoose from "mongoose";

const cmsContentSchema = new mongoose.Schema({
    hero: {
        tag: { type: String, default: "Creative Agency & Shop" },
        titleLine1: { type: String, default: "HOUSE" },
        titleLine2: { type: String, default: "OF" },
        titleLine3: { type: String, default: "VISUALS" },
        subtitle: { type: String, default: "Creative growth and marketing house." },
    },
    services: [
        {
            title: { type: String, required: true },
            items: [{ type: String }],
        },
    ],
    portfolio: [
        {
            id: { type: Number },
            category: { type: String },
            title: { type: String },
            img: { type: String },
            span: { type: String, enum: ["normal", "wide", "tall"], default: "normal" },
        },
    ],
    statistics: [
        {
            value: { type: String },
            label: { type: String },
        },
    ],
    shopHighlight: {
        tag: { type: String, default: "Shop Internet Culture" },
        title1: { type: String, default: "Wear The" },
        title2: { type: String, default: "Vision." },
    },
    cta: {
        titleLine1: { type: String, default: "READY TO" },
        titleLine2: { type: String, default: "BE SEEN?" },
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
}, { timestamps: true });

export default mongoose.model("CmsContent", cmsContentSchema);
