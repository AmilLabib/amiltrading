import { Redis } from '@upstash/redis'
import { createMemoryRedis } from './memory-redis.js'

// Upstash via Vercel Marketplace sets KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

if (!url && process.env.VERCEL) throw new Error('Redis belum terhubung: set KV_REST_API_URL & KV_REST_API_TOKEN')

export const redis = url ? new Redis({ url, token }) : createMemoryRedis()

export const ENTRIES_KEY = 'td:entries'
export const entryKey = (id) => `td:entry:${id}`
