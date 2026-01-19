// import type { StringValue } from 'ms';
const jwtExpiration = (process.env.JWT_EXPIRATION ?? '7d');
export const config = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || "your-super-secret-key-here-make-it-long-and-random",
    jwtExpiration, nodeEnv: process.env.NODE_ENV || 'development',
    phoenixUrl: process.env.PHOENIX_URL || 'http://localhost:4000',
    phoenixApiKey: process.env.PHOENIX_API_KEY || 'your-secret-api-key',
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
};
