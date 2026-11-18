"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const db_js_1 = require("../db.js");
const router = (0, express_1.Router)();
const scryptAsync = (0, util_1.promisify)(crypto_1.default.scrypt);
function hashPassword(password) {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    return scryptAsync(password, salt, 64).then((derivedKey) => `${salt}:${derivedKey.toString('hex')}`);
}
async function verifyPassword(password, storedHash) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key)
        return false;
    const derivedKey = await scryptAsync(password, salt, 64);
    const expectedKey = Buffer.from(key, 'hex');
    return derivedKey.length === expectedKey.length &&
        crypto_1.default.timingSafeEqual(derivedKey, expectedKey);
}
function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        customerType: user.customerType,
        contractedPowerKva: user.contractedPowerKva,
        role: user.role,
    };
}
async function createSession(userId) {
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db_js_1.prisma.session.create({ data: { token, userId, expiresAt } });
    return token;
}
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, address, city, password, customerType = 'RESIDENTIAL', contractedPowerKva = 4, } = req.body;
        const cleanEmail = String(email || '').trim().toLowerCase();
        if (!name || !cleanEmail || !phone || !address || !city || !password) {
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent etre renseignes.' });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caracteres.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ error: 'Adresse e-mail invalide.' });
        }
        const existing = await db_js_1.prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
            return res.status(409).json({ error: 'Un compte existe deja avec cette adresse e-mail.' });
        }
        const user = await db_js_1.prisma.user.create({
            data: {
                name: String(name).trim(),
                email: cleanEmail,
                phone: String(phone).trim(),
                address: String(address).trim(),
                city: String(city).trim(),
                passwordHash: await hashPassword(String(password)),
                customerType: String(customerType).toUpperCase(),
                contractedPowerKva: Number(contractedPowerKva),
                role: 'CLIENT',
            },
        });
        const token = await createSession(user.id);
        res.status(201).json({ token, user: publicUser(user) });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/signin', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis.' });
        }
        const user = await db_js_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== 'CLIENT' || !(await verifyPassword(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Identifiants incorrects ou compte non autorise.' });
        }
        await db_js_1.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
        const token = await createSession(user.id);
        res.json({ token, user: publicUser(user) });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/me', async (req, res) => {
    const token = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token)
        return res.status(401).json({ error: 'Non authentifie.' });
    const session = await db_js_1.prisma.session.findUnique({
        where: { token },
        include: { user: true },
    });
    if (!session || session.expiresAt < new Date() || session.user.role !== 'CLIENT') {
        return res.status(401).json({ error: 'Session expiree.' });
    }
    res.json({ user: publicUser(session.user) });
});
router.post('/signout', async (req, res) => {
    const token = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
    if (token)
        await db_js_1.prisma.session.deleteMany({ where: { token } });
    res.json({ success: true });
});
exports.default = router;
