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
const seed_js_1 = require("./seed.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.use('/api', api_js_1.default);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'HEALTHY', timestamp: new Date() });
});
// Root fallback endpoint for server
app.get('/', (_req, res) => {
    if (clientDistPath) {
        return res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    }
    res.json({
        status: 'ONLINE',
        service: 'SMARTGRID Server',
        api: '/api',
        health: '/health',
        timestamp: new Date()
    });
});
// Serve frontend static files if built
const possibleClientPaths = [
    path_1.default.resolve(process.cwd(), '../client/dist'),
    path_1.default.resolve(process.cwd(), 'client/dist'),
    path_1.default.resolve(__dirname, '../../client/dist'),
];
let clientDistPath = '';
for (const p of possibleClientPaths) {
    if (fs_1.default.existsSync(p)) {
        clientDistPath = p;
        break;
    }
}
if (clientDistPath) {
    app.use(express_1.default.static(clientDistPath));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    });
}
async function startServer() {
    try {
        await (0, seed_js_1.seedDatabase)();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`⚡ SMARTGRID API Server running on http://localhost:${PORT}`);
            console.log(`📊 Endpoints mounted at http://localhost:${PORT}/api`);
            if (clientDistPath) {
                console.log(`🚀 Production frontend served at http://localhost:${PORT}`);
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
