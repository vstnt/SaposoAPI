import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import CartsController from './carts_controller.js'
import RefreshToken from '#models/refresh_token'
import { DateTime } from 'luxon'


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
    const accessToken = await auth.use('jwt').generate(user, '30s') // ex:(user, 10m) para não usar o tempo de expiração padrão de auth/guards/jwt.ts
    const refreshToken = await User.refreshTokens.create(user, ['*'], { expiresIn: '1m' })
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


  async logout({ request, auth }: HttpContext) { // falta adicionar o token de acesso à lista de revogados
    const user = auth.user
    const { refresh_token } = request.only(['refresh_token'])

    if (user && refresh_token) {
      await RefreshToken.query().where('user_id', user.id).where('hash', refresh_token).delete()
      return Response.json({ message: 'Logged out successfully' })

    }
    return 'erro de deleção de token'
    /* const token = user?.currentAccessToken   método antigo que utilizava tokens de db

    if (user && token) {
      await User.accessTokens.delete(user, token.identifier)
      return { status: true }
    }
    
    return 'erro de deleção de token'
        */
   return { status: true }
  }


  // método de rota a ser chamada pelo front quando o access token expira
  async refreshToken({ request, auth }: HttpContext) {
    const { refresh_token } = request.only(['refresh_token'])

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

}

