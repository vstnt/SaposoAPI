import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import CartsController from './carts_controller.js'


export default class AuthController {

  async signin({ request }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)
    const cartsController = new CartsController()
    cartsController.createCartLogin(user.id)
    return { user: this.getSafeUser(user), token: token.value!.release() }
  }

  async validateToken({ auth }: HttpContext) {
    const user = auth.user
    if (!user) {
      return { error: 'Invalid token' }

    }
    return { user: this.getSafeUser(user) }
  }

  async logout({ auth }: HttpContext) {
    const user = auth.user
    const token = user?.currentAccessToken


    if (user && token) {
      await User.accessTokens.delete(user, token.identifier)
      return { status: true }
    }
    return 'erro de deleção de token'
  }

  private getSafeUser(user: User) { //aqui tratamos de reduzir os dados de usuário enviados ao front
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
    }
  }
}

