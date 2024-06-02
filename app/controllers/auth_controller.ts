import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'


export default class AuthController {
  public async signin({ request, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      // Tenta autenticar o usuário e retorna o token e o usuário autenticado
      const token = await auth.use('api').attempt(email, password)
      const user = auth.user
      return { user: this.getSafeUser(user), token: token.token }
    } catch {
      return { error: 'Invalid credentials' }
    }
  }

  public async validateToken({ auth }: HttpContext) {
    const user = auth.user
    return { user: this.getSafeUser(user) }
  }

  public async logout({ auth }: HttpContext) {
    await auth.use('api').revoke()
    return { status: true }
  }

  private getSafeUser(user: User) {
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      // Adicione outros campos que você deseja expor ao front-end
    }
  }
}

