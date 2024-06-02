import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'


export default class AuthController {

  async signin({ request }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)
    return { user: this.getSafeUser(user), token: token }
  }

  async validateToken({ auth }: HttpContext) {
    const user = auth.user
    if (!user) {
      return { error: 'Invalid token' }

    }
    return { user: this.getSafeUser(user) }
  }

  async logout({ auth, request }: HttpContext) {
    const token = request.input('token')
    const user = auth.user

    if (user) {
      await User.accessTokens.delete(user, token)
    }
    return { status: true }
  }

  private getSafeUser(user: User) { //aqui tratamos de reduzir os dados de usuário enviados ao front
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
    }
  }
}

