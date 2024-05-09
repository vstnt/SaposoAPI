import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  async index({}: HttpContext) {
    return await User.all()
  }

  async index2({ params }: HttpContext) {
    const user: User | null = await User.find(params.id)
    if (!user) {
      return 'Usuário não encontrado'
    }
    return user
  }

  async store({ request }: HttpContext) {
    const user: User = await User.create(request.all())
    user
    return 'Inserção realizada'
  }

  async update({ params, request }: HttpContext) {
    const user: User | null = await User.find(params.id)
    if (!user) {
      return 'Usuário não encontrado'
    }
    user.fullName = request.input('full_name')
    user.email = request.input('email')
    await user?.save()
    return user
  }

  async destroy({ params }: HttpContext) {
    const user: User | null = await User.find(params.id)
    if (user) {
      await user.delete()
      return 'Usuário deletado'
    }
    return 'Usuário não encontrado'
  }
}
