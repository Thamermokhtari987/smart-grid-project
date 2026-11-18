"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const api_js_1 = __importDefault(require("./routes/api.js"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const seed_js_1 = require("./seed.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.use('/api', api_js_1.default);
app.use('/api/auth', auth_js_1.default);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'HEALTHY', timestamp: new Date() });
});
// ----------------------------------------------------------------
// Static frontend — search for the built client in priority order.
// On Vercel: server/public is copied from client/dist during build.
// Locally:   client/dist is built separately and found by relative path.
// ----------------------------------------------------------------
const possibleClientPaths = [
    // Vercel / production: client build copied here by scripts/copy-client.js
    path_1.default.resolve(__dirname, '../public'),
    path_1.default.resolve(process.cwd(), 'server/public'),
    // Local dev fall-backs
    path_1.default.resolve(process.cwd(), '../client/dist'),
    path_1.default.resolve(process.cwd(), 'client/dist'),
    path_1.default.resolve(__dirname, '../../client/dist'),
];
let clientDistPath = '';
for (const p of possibleClientPaths) {
    if (fs_1.default.existsSync(p)) {
        clientDistPath = p;
        console.log(`Frontend static files found at: ${p}`);
        break;
    }
}
if (clientDistPath) {
    // Serve static assets (JS, CSS, images, etc.)
    app.use(express_1.default.static(clientDistPath));
    // SPA fallback — serve index.html for any non-API route
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path === '/health') {
            // Should not reach here due to route ordering, but guard just in case
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    });
}
else {
    // No frontend build found — return server info at root
    app.get('/', (_req, res) => {
        res.json({
            status: 'ONLINE',
            service: 'SMARTGRID Server',
            api: '/api',
            health: '/health',
            note: 'Frontend not built. Run: npm run build:client && npm run copy:client',
            timestamp: new Date()
        });
    });
}
async function startServer() {
    try {
        await (0, seed_js_1.seedDatabase)();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SMARTGRID API Server running on http://localhost:${PORT}`);
            console.log(`📡 Endpoints mounted at http://localhost:${PORT}/api`);
            if (clientDistPath) {
                console.log(`🌐 Production frontend served at http://localhost:${PORT}`);
            }
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// In local development or standalone server, start the HTTP server
if (!process.env.VERCEL) {
    startServer();
}
exports.default = app;
