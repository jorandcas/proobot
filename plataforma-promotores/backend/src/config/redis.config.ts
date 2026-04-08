import Redis from 'ioredis';

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create Redis connection
export const redis = new Redis(redisConfig);

// Redis connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('close', () => {
  console.log('⚠️  Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

export default redis;
