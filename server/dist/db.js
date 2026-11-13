"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
function getDatabaseUrl() {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    // Find the bundled dev.db SQLite database
    const possiblePaths = [
        path_1.default.resolve(process.cwd(), 'prisma/dev.db'),
        path_1.default.resolve(process.cwd(), 'server/prisma/dev.db'),
        path_1.default.resolve(__dirname, '../prisma/dev.db'),
        path_1.default.resolve(__dirname, '../../prisma/dev.db'),
    ];
    let sourceDbPath = '';
    for (const p of possiblePaths) {
        if (fs_1.default.existsSync(p)) {
            sourceDbPath = p;
            break;
        }
    }
    // In serverless environments (like Vercel), /var/task is read-only.
    // We copy the database to the writable /tmp directory so writes/WAL work cleanly.
    if (process.env.VERCEL) {
        const tmpDbPath = path_1.default.join(os_1.default.tmpdir(), 'smartgrid_dev.db');
        if (sourceDbPath && (!fs_1.default.existsSync(tmpDbPath) || fs_1.default.statSync(tmpDbPath).size === 0)) {
            try {
                fs_1.default.copyFileSync(sourceDbPath, tmpDbPath);
                console.log(`📦 Seeded database initialized to writable /tmp: ${tmpDbPath}`);
            }
            catch (err) {
                console.error('Failed to copy database to /tmp:', err.message);
            }
        }
        const normalizedTmpPath = tmpDbPath.replace(/\\/g, '/');
        return `file:${normalizedTmpPath}`;
    }
    if (sourceDbPath) {
        const normalizedPath = sourceDbPath.replace(/\\/g, '/');
        return `file:${normalizedPath}`;
    }
    return 'file:./dev.db';
}
const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;
exports.prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: dbUrl,
        },
    },
});
