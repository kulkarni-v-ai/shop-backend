import express from "express";
import CmsContent from "../models/CmsContent.js";
import verifyToken, { authorize } from "../middleware/auth.js";
import { logAction } from "../utils/logger.js";

const router = express.Router();

// Default CMS data used when no database entry exists
const defaultCMSData = {
    hero: {
        tag: "Creative Agency & Shop",
        titleLine1: "HOUSE",
        titleLine2: "OF",
        titleLine3: "VISUALS",
        subtitle: "Creative growth and marketing house.",
    },
    services: [
        { title: "House of Media", items: ["Content Creation", "Video Campaigns", "Storytelling"] },
        { title: "House of Vision", items: ["SEO", "Meta Ads", "Performance Marketing", "Growth Strategy"] },
        { title: "House of Art", items: ["Brand Visuals", "Design Systems", "Creative Direction"] },
        { title: "Management", items: ["Social Media Handling", "Brand Consulting"] },
    ],
    portfolio: [
        { id: 1, category: "Ad Creatives", title: "Lux Campaign", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1200", span: "wide" },
        { id: 2, category: "Reels", title: "Motion Series", img: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=1200", span: "tall" },
        { id: 3, category: "Campaign Visuals", title: "Brand Elevation", img: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1200", span: "normal" },
        { id: 4, category: "Brand Identity", title: "Visual System", img: "https://images.unsplash.com/photo-1634942537034-2531766767d1?auto=format&fit=crop&q=80&w=1200", span: "normal" },
        { id: 5, category: "Ad Creatives", title: "Product Launch", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200", span: "normal" },
        { id: 6, category: "Campaign Visuals", title: "Growth Drive", img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200", span: "wide" },
        { id: 7, category: "Reels", title: "Story Reel", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200", span: "normal" },
        { id: 8, category: "Brand Identity", title: "Identity Craft", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200", span: "tall" },
    ],
    statistics: [
        { value: "10M+", label: "Views" },
        { value: "5X", label: "ROAS" },
        { value: "200+", label: "Campaigns" },
        { value: "50+", label: "Brands" },
    ],
    shopHighlight: {
        tag: "Shop Internet Culture",
        title1: "Wear The",
        title2: "Vision.",
    },
    cta: {
        titleLine1: "READY TO",
        titleLine2: "BE SEEN?",
    },
};

/**
 * GET /api/cms
 * Public — fetch current CMS content
 */
router.get("/", async (req, res) => {
    try {
        let cms = await CmsContent.findOne().sort({ updatedAt: -1 });
        if (!cms) {
            // Seed default data on first request
            cms = await CmsContent.create(defaultCMSData);
        }
        res.json(cms);
    } catch (error) {
        console.error("CMS fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch CMS content" });
    }
});

/**
 * PUT /api/cms
 * Protected — superadmin only. Update CMS content with validation.
 */
router.put("/", verifyToken, authorize("superadmin"), async (req, res) => {
    try {
        const { hero, services, portfolio, statistics, shopHighlight, cta } = req.body;

        // --- Server-side validation ---
        const errors = [];

        if (hero) {
            if (typeof hero.tag !== "string" || hero.tag.length > 200) errors.push("hero.tag invalid");
            if (typeof hero.titleLine1 !== "string" || hero.titleLine1.length > 50) errors.push("hero.titleLine1 invalid");
            if (typeof hero.titleLine2 !== "string" || hero.titleLine2.length > 50) errors.push("hero.titleLine2 invalid");
            if (typeof hero.titleLine3 !== "string" || hero.titleLine3.length > 50) errors.push("hero.titleLine3 invalid");
            if (typeof hero.subtitle !== "string" || hero.subtitle.length > 500) errors.push("hero.subtitle invalid");
        }

        if (services) {
            if (!Array.isArray(services) || services.length > 10) errors.push("services must be an array (max 10)");
            services.forEach((s, i) => {
                if (typeof s.title !== "string" || s.title.length > 100) errors.push(`services[${i}].title invalid`);
                if (!Array.isArray(s.items) || s.items.length > 20) errors.push(`services[${i}].items invalid`);
            });
        }

        if (portfolio) {
            if (!Array.isArray(portfolio) || portfolio.length > 20) errors.push("portfolio must be an array (max 20)");
            portfolio.forEach((p, i) => {
                if (typeof p.title !== "string" || p.title.length > 100) errors.push(`portfolio[${i}].title invalid`);
                if (typeof p.img !== "string" || p.img.length > 500) errors.push(`portfolio[${i}].img invalid`);
                if (!["normal", "wide", "tall"].includes(p.span)) errors.push(`portfolio[${i}].span invalid`);
            });
        }

        if (statistics) {
            if (!Array.isArray(statistics) || statistics.length > 10) errors.push("statistics must be an array (max 10)");
            statistics.forEach((s, i) => {
                if (typeof s.value !== "string" || s.value.length > 20) errors.push(`statistics[${i}].value invalid`);
                if (typeof s.label !== "string" || s.label.length > 50) errors.push(`statistics[${i}].label invalid`);
            });
        }

        if (shopHighlight) {
            if (typeof shopHighlight.tag !== "string" || shopHighlight.tag.length > 200) errors.push("shopHighlight.tag invalid");
            if (typeof shopHighlight.title1 !== "string" || shopHighlight.title1.length > 50) errors.push("shopHighlight.title1 invalid");
            if (typeof shopHighlight.title2 !== "string" || shopHighlight.title2.length > 50) errors.push("shopHighlight.title2 invalid");
        }

        if (cta) {
            if (typeof cta.titleLine1 !== "string" || cta.titleLine1.length > 100) errors.push("cta.titleLine1 invalid");
            if (typeof cta.titleLine2 !== "string" || cta.titleLine2.length > 100) errors.push("cta.titleLine2 invalid");
        }

        if (errors.length > 0) {
            return res.status(400).json({ message: "Validation failed", errors });
        }

        // Build update object with only provided fields
        const updateData = { updatedBy: req.admin.id };
        if (hero) updateData.hero = hero;
        if (services) updateData.services = services;
        if (portfolio) updateData.portfolio = portfolio;
        if (statistics) updateData.statistics = statistics;
        if (shopHighlight) updateData.shopHighlight = shopHighlight;
        if (cta) updateData.cta = cta;

        let cms = await CmsContent.findOne().sort({ updatedAt: -1 });
        if (!cms) {
            cms = await CmsContent.create({ ...defaultCMSData, ...updateData });
        } else {
            Object.assign(cms, updateData);
            await cms.save();
        }

        await logAction({
            userId: req.admin.id,
            role: req.admin.role,
            actionType: "CMS_UPDATE",
            metadata: { sections: Object.keys(req.body).filter(k => k !== "updatedBy") },
            ipAddress: req.ip,
        });

        res.json({ message: "CMS content updated", cms });
    } catch (error) {
        console.error("CMS update error:", error.message);
        res.status(500).json({ message: "Failed to update CMS content" });
    }
});

export default router;
