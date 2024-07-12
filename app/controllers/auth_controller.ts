import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import CartsController from './carts_controller.js'
import RefreshToken from '#models/refresh_token'
import { DateTime } from 'luxon'
import redis from '@adonisjs/redis/services/main'


export default class AuthController {
  
  //aqui tratamos de reduzir os dados de usuário enviados ao front
  private getSafeUser(user: User) {
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
    }
  }


  async signin({ request, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)
    //const token = await User.accessTokens.create(user) alterado para JWT, mas é reutilizado para fazer os refresh tokens!
    const accessToken = await auth.use('jwt').generate(user, '10s') // ex:(user, 10m) para não usar o tempo de expiração padrão de auth/guards/jwt.ts
    const refreshToken = await User.refreshTokens.create(user, ['*'], { expiresIn: '5m' })
    const cartsController = new CartsController()
    cartsController.createCartLogin(user.id)
    //return { user: this.getSafeUser(user), token: token.value!.release() } alterado para JWT
    return { user: this.getSafeUser(user), token: accessToken.token, refreshToken: refreshToken.hash }
  }


  async validateToken({ auth }: HttpContext) {
    const user = auth.user
    if (!user) {
      return { error: 'Invalid token' }

    }
    return { user: this.getSafeUser(user) }
  }

  async revokeAccessToken(token: string) {
    const expiresAt = DateTime.now().plus({ minutes: 15 }).toSeconds()  // Ajuste o tempo de expiração conforme necessário
    await redis.set(`revoked_token:${token}`, 'true', 'EX', Math.ceil(expiresAt))
  }

  async logout({ request, auth }: HttpContext) { // falta adicionar o token de acesso à lista de revogados
    const user = auth.user
    const token = request.header('authorization')?.split('Bearer ')
    const refresh_token = request.header('refresh_token')

    if (user) {
      if(token){
        this.revokeAccessToken(token[1])
      }
      if (refresh_token) {
        await RefreshToken.query().where('tokenable_id', user.id).where('hash', refresh_token).delete()
        return { status: true, message:'Logged out successfully com refresh token' }
      }
      return { status: true, message:'Logged out successfully sem refresh token' }

    }
    return 'erro de logout, usuário não encontrado'
    /* const token = user?.currentAccessToken   método antigo que utilizava tokens de db

    if (user && token) {
      await User.accessTokens.delete(user, token.identifier)
      return { status: true }
    }
    
    return 'erro de deleção de token'
        */
  }


  // método de rota a ser chamada pelo front quando o access token expira
  async refreshToken({ request, auth }: HttpContext) {
    const refresh_token = request.header('refresh_token')
    if (!refresh_token || refresh_token == undefined){return 'Refresh token not obtained at controller'}

    // encontramos o refresh token, aproveitando pra checar se ele não expirou.
    const storedToken = await RefreshToken.query()
    .where('hash', refresh_token)
    .where('expires_at', '>', DateTime.now().toSQL())
    .first()
    if (!storedToken) {
      return 'Invalid or expired refresh token'
    }

    // encontramos o usuário associado ao token
    const user = await storedToken.related('user').query().first()
    if (!user) {
      return 'User not found'
    }

    // lhe fornecemos novos token de acesso e token de atualização, e deletamos o token de atualização utilizado
    const newAccessToken = await auth.use('jwt').generate(user, '30s')
    const newRefreshToken = await User.refreshTokens.create(user, ['*'], { expiresIn: '1m' })
    await storedToken.delete()
    return { user: this.getSafeUser(user), token: newAccessToken.token, refreshToken: newRefreshToken.hash }
  }


  async indexRefreshToken({}: HttpContext) {
    return await RefreshToken.all()
  }


  async delete({ params }: HttpContext) {
    const refreshToken = await RefreshToken.find(params.id)
    if (refreshToken) {
      await refreshToken.delete()
      return 'refreshToken deletado'
    }
    return 'refreshToken não encontrado'
  }

  

}

