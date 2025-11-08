// Read JWT secret and port from environment with fallbacks
export const JWT_PASSWORD = process.env.JWT_PASSWORD ?? "123kasdk123";
export const WS_PORT = Number(process.env.WS_PORT ?? 3001);