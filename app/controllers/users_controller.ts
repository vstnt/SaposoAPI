import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'

async function deleteOldImage(imagePath: string) {
  const completePath = app.makePath(imagePath)
  if (fs.existsSync(completePath)) {
    fs.unlinkSync(completePath)
  }
}

export default class UsersController {
  async indexall({}: HttpContext) {
    return await User.all()
  }

  async indexunit({ params }: HttpContext) {
    const user: User | null = await User.find(params.id)
    if (!user) {
      return 'Usuário não encontrado'
    }
    return user
  }

  async store({ request, response }: HttpContext) {
    const images = request.files('image', {
      size: '1mb',
      extnames: ['jpg', 'JPG', 'png', 'gif'],
    })

    // checa se tem só uma imagem
    if (images.length > 1) {
      return response.status(400).send('Envie apenas uma imagem para o usuário.')
    }
    const image = images[0]

    if (!image) {
      const user: User = await User.create(request.all())
      user
      return 'Inserção de usuário realizada'
    }

    if (!image.hasErrors) {
      if (request.input('imageUrl')) {
        return 'Inserir apenas uma URL ou arquivo de imagem.'
      }

      const imageName = `${new Date().getTime()}.${image.extname}`
      const imageUrl = `public/uploads/userImgs/${imageName}`
      const userData = request.only(['fullName', 'email', 'password'])
      await User.create({ ...userData, imageUrl })
      await image.move(app.publicPath('uploads/userImgs'), { name: imageName })
      return 'Inserção de usuário realizada'
    } else {
      return response.status(400).send(image.errors)
    }
  }

  async update({ params, request, response }: HttpContext) {
    // lembre que, para limpar qualquer campo do produto, basta enviar a key com value vazio, null.
    // primeiro recolhemos a imagem, caso exista, validamos quantidade, tipo, tamanho.
    const images = request.files('image', {
      size: '1mb',
      extnames: ['jpg', 'JPG', 'png', 'gif'],
    })
    // checa se tem só uma imagem
    if (images.length > 1) {
      return response.status(400).send('Por favor, envie apenas uma imagem para o usuário.')
    }
    const image = images[0]

    const user: User | null = await User.find(params.id)
    if (!user) {
      return 'Usuário não encontrado'
    }
    user.fullName = request.input('fullName')
    user.email = request.input('email')
    user.password = request.input('password')

    if (!image && request.input('imageUrl')) {
      const oldPath = user.imageUrl
      user.imageUrl = request.input('imageUrl')
      await user?.save()
      // deletar possível img anterior
      deleteOldImage(oldPath)
      return 'Usuário atualizado'
    }

    // existe uma imagem, sem erros, com erros
    if (image && !image.hasErrors) {
      // tem imagem, mas tbm tem URL de imagem
      if (request.input('imageUrl')) {
        return 'Inserir apenas uma URL ou arquivo de imagem.'
      }

      // tem apenas a imagem, validada
      const imageName = `${new Date().getTime()}.${image.extname}`
      const imageUrl = `public/uploads/userImgs/${imageName}`
      const oldPath = user.imageUrl
      user.imageUrl = imageUrl
      await user?.save()
      await image.move(app.publicPath('uploads/userImgs'), { name: imageName })
      // deletar possível img anterior
      deleteOldImage(oldPath)
      return 'Usuário atualizado'
    } else {
      // situação de img com erros
      if (image && image.hasErrors) {
        return response.status(400).send(image.errors)
      }
    }
    await user?.save()
    return 'Usuário atualizado'
  }

  async destroy({ params }: HttpContext) {
    const user: User | null = await User.find(params.id)
    if (user) {
      const oldPath = user.imageUrl
      await user.delete()
      deleteOldImage(oldPath)
      return 'Usuário deletado'
    }
    return 'Usuário não encontrado'
  }
}
