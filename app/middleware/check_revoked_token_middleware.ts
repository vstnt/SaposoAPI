import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import redis from '@adonisjs/redis/services/main'

export default class CheckRevokedTokenMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    //console.log(ctx)
    
    const token = ctx.request.header('authorization')?.split('Bearer ')
    
    if (!token) {
      return (ctx.response.send('sem token no middleware CheckRevokedToken'))
    }

    const isRevoked = await redis.get(`revoked_token:${token[1]}`)
    if (isRevoked) {
      return (ctx.response.send('Token has been revoked'))
    }

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}