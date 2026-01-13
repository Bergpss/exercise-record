import type { Plugin } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load environment variables from .env files
 */
function loadEnvFiles() {
    const envFiles = ['.env.local', '.env'];
    const root = process.cwd();
    let loadedCount = 0;

    for (const file of envFiles) {
        const filePath = join(root, file);
        if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const match = trimmed.match(/^([^=]+)=(.*)$/);
                    if (match) {
                        const key = match[1].trim();
                        const value = match[2].trim().replace(/^["']|["']$/g, '');
                        // Only set if not already in process.env
                        if (!process.env[key]) {
                            process.env[key] = value;
                            loadedCount++;
                        }
                        // Also set VITE_ prefixed vars without prefix for server-side use
                        if (key.startsWith('VITE_')) {
                            const serverKey = key.replace(/^VITE_/, '');
                            if (!process.env[serverKey]) {
                                process.env[serverKey] = value;
                                loadedCount++;
                            }
                        }
                    }
                }
            }
        }
    }

    if (loadedCount > 0) {
        console.log(`[vite-plugin-api] Loaded ${loadedCount} environment variables from .env files`);
    }
}

/**
 * Vite plugin to handle Vercel-style API routes in development
 */
export function vitePluginApi(): Plugin {
    // Load environment variables on plugin initialization
    loadEnvFiles();

    return {
        name: 'vite-plugin-api',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                // Only handle /api/ routes
                if (!req.url?.startsWith('/api/')) {
                    return next();
                }

                try {
                    // Extract the API route name (e.g., /api/generate-summary -> generate-summary)
                    const routePath = req.url.replace('/api/', '').split('?')[0];
                    
                    // Use Vite's SSR module loader to import the API handler
                    // Convert to file:// URL for Windows compatibility
                    const apiModulePath = join(process.cwd(), 'api', `${routePath}.ts`);
                    const handlerModule = await server.ssrLoadModule(apiModulePath);
                    const handler = handlerModule.default;

                    if (typeof handler !== 'function') {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: 'API handler not found' }));
                        return;
                    }

                    // Create Vercel-compatible request/response objects
                    const vercelReq: any = {
                        method: req.method,
                        headers: req.headers as Record<string, string | string[] | undefined>,
                        query: {},
                        body: undefined,
                    };

                    // Parse query string
                    if (req.url.includes('?')) {
                        const queryString = req.url.split('?')[1];
                        const params = new URLSearchParams(queryString);
                        vercelReq.query = Object.fromEntries(params);
                    }

                    // Parse body for POST/PUT requests
                    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                        const chunks: Buffer[] = [];
                        req.on('data', (chunk) => chunks.push(chunk));
                        req.on('end', async () => {
                            try {
                                const body = Buffer.concat(chunks).toString();
                                vercelReq.body = body ? JSON.parse(body) : undefined;

                                // Create Vercel-compatible response object
                                const vercelRes: any = {
                                    statusCode: 200,
                                    headers: {},
                                    _headers: {},
                                    status: function (code: number) {
                                        this.statusCode = code;
                                        res.statusCode = code;
                                        return this;
                                    },
                                    json: function (data: any) {
                                        this.setHeader('Content-Type', 'application/json');
                                        res.setHeader('Content-Type', 'application/json');
                                        res.statusCode = this.statusCode;
                                        res.end(JSON.stringify(data));
                                    },
                                    setHeader: function (name: string, value: string) {
                                        this._headers[name.toLowerCase()] = value;
                                        res.setHeader(name, value);
                                    },
                                    end: function (data?: any) {
                                        res.statusCode = this.statusCode;
                                        Object.keys(this._headers).forEach((key) => {
                                            res.setHeader(key, this._headers[key]);
                                        });
                                        res.end(data);
                                    },
                                };

                                await handler(vercelReq, vercelRes);
                            } catch (error: any) {
                                console.error('API handler error:', error);
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
                            }
                        });
                    } else {
                        // For GET/OPTIONS requests, handle immediately
                        const vercelRes: any = {
                            statusCode: 200,
                            headers: {},
                            _headers: {},
                            status: function (code: number) {
                                this.statusCode = code;
                                res.statusCode = code;
                                return this;
                            },
                            json: function (data: any) {
                                this.setHeader('Content-Type', 'application/json');
                                res.setHeader('Content-Type', 'application/json');
                                res.statusCode = this.statusCode;
                                res.end(JSON.stringify(data));
                            },
                            setHeader: function (name: string, value: string) {
                                this._headers[name.toLowerCase()] = value;
                                res.setHeader(name, value);
                            },
                            end: function (data?: any) {
                                res.statusCode = this.statusCode;
                                Object.keys(this._headers).forEach((key) => {
                                    res.setHeader(key, this._headers[key]);
                                });
                                res.end(data);
                            },
                        };

                        await handler(vercelReq, vercelRes);
                    }
                } catch (error: any) {
                    console.error('API route error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
                }
            });
        },
    };
}
