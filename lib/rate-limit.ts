/**
 * Simple in-memory rate limiting
 * For production, consider using Redis-based solution like @upstash/ratelimit
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

interface RateLimitOptions {
  limit: number // Number of requests
  window: number // Time window in milliseconds
}

export function rateLimit(identifier: string, options: RateLimitOptions): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = identifier
  const record = store[key]

  // Clean up expired entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k]
      }
    })
  }

  if (!record || record.resetTime < now) {
    // Create new record or reset expired one
    store[key] = {
      count: 1,
      resetTime: now + options.window
    }
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetAt: now + options.window
    }
  }

  if (record.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetTime
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: options.limit - record.count,
    resetAt: record.resetTime
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return ip
}

/**
 * Rate limit middleware helper
 */
export function createRateLimitMiddleware(options: RateLimitOptions) {
  return async (request: Request): Promise<Response | null> => {
    const identifier = getClientIdentifier(request)
    const result = rateLimit(identifier, options)

    if (!result.allowed) {
      const resetSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${resetSeconds} seconds.`
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': resetSeconds.toString(),
            'X-RateLimit-Limit': options.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toString(),
          }
        }
      )
    }

    return null // Continue with request
  }
}
