import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import { deleteOldImage, extTypes, imgSize, usersImgsPath, usersImgsPublicPath, usersImgsUrl } from './exports.js'

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
      size: imgSize,
      extnames: extTypes,
    })

    // checa se tem só uma imagem
    if (images.length > 1) {
      return response.status(400).send('Envie apenas uma imagem para o usuário.')
    }
    const image = images[0]

    if (!image) {
      await User.create(request.all())
      return 'Inserção de usuário realizada'
    }

    if (!image.hasErrors) {
      if (request.input('imageUrl')) {
        return 'Inserir apenas uma URL ou arquivo de imagem.'
      }

      // chegamos aqui caso contenha img, validada e sem erros
      const imageName = `${new Date().getTime()}.${image.extname}`
      const imageUrl = `${usersImgsUrl}${imageName}`
      const imageDelPath = `${usersImgsPath}${imageName}`
      const userData = request.only(['fullName', 'email', 'password'])
      await User.create({ ...userData, imageUrl, imageDelPath })
      await image.move(app.publicPath(`${usersImgsPublicPath}`), { name: imageName })

      return 'Inserção de usuário realizada'
    } else {
      return response.status(400).send(image.errors)
    }
  }


  async update({ params, request, response }: HttpContext) {
    // lembre que, para limpar qualquer campo do produto, basta enviar a key com value vazio, null.
    // primeiro recolhemos a imagem. Caso exista, validamos quantidade, tipo, tamanho.
    const images = request.files('image', {
      size: imgSize,
      extnames: extTypes,
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
      const imageDelPath = user.imageDelPath
      user.imageUrl = request.input('imageUrl')
      await user?.save()
      // deletar possível img anterior
      deleteOldImage(imageDelPath)
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
      user.imageUrl = `${usersImgsUrl}${imageName}`
      // recuperamos o caminho da imagem antiga, para deleção
      const imageDelPath = user.imageDelPath
      // atualizamos o caminho de deleção para a nova imagem
      user.imageDelPath = `${usersImgsPath}${imageName}`
      await user?.save()
      await image.move(app.publicPath(`${usersImgsPublicPath}`), { name: imageName })
      // deletamos a img anterior, caso esteja no back-end
      deleteOldImage(imageDelPath)

      return 'Usuário atualizado'
    } else {
      // situação de img com erros
      if (image && image.hasErrors) {
        return response.status(400).send(image.errors)
      }
    }

    // save para o caso sem alterações de imagem
    await user?.save()
    return 'Usuário atualizado'
  }


  async destroy({ params }: HttpContext) {
    const user: User | null = await User.find(params.id)
    if (user) {
      const imageDelPath = user.imageDelPath
      await user.delete()
      deleteOldImage(imageDelPath)
      return 'Usuário deletado'
    }
    return 'Usuário não encontrado'
  }
}
