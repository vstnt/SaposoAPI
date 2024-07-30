import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import { deleteOldImage, extTypes, imgSize, usersImgsPath, usersImgsPublicPath, usersImgsUrl } from './exports.js'
import Cart from '#models/cart'

/* em minha última revisão aqui, adicionei uns blocos try-catch quando vi ações de alteração na db,
 será que é necessário? Ou isso é algo a se fazer apenas nas requisições do front-end? E se for necessário,
 não devo englobar cada método do controlador com esses blocos de uam vez? Com isso não só alterações na db,
 mas também buscas nela estariam protegidas por esses blocos. Mas pensando bem, talvez não seja correto que
 o front receba as informaçoes dos erros ocorridos no back, não? Questões de segurança de dados.*/

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


  async register({ request, response }: HttpContext) {
    const images = request.files('image', {
      size: imgSize,
      extnames: extTypes,
    })

    // checa se tem só uma imagem
    if (images.length > 1) {
      return response.status(400).send('Envie apenas uma imagem para o usuário.')
    }
    const image = images[0]

    if (!image) { // alterado firebase
      try {
        const user = await User.create(request.all())
        if (request.input('source') == 'backend') {
          user.uid = user.id.toString()
          await user.save()
        }
        return 'Inserção de usuário realizada'
      } catch (error) {
        return response.status(400).send(error)
      }

    }

    if (!image.hasErrors) {
      // caso tenha inserido uma imagem e uma url de imagem
      if (request.input('imageUrl')) {
        return 'Inserir apenas uma URL ou arquivo de imagem.'
      }

      // chegamos aqui caso contenha img, validada e sem erros
      try {
        const imageName = `${new Date().getTime()}.${image.extname}`
        const imageUrl = `${usersImgsUrl}${imageName}`
        const imageDelPath = `${usersImgsPath}${imageName}`
        const userData = request.only(['fullName', 'email', 'password'])
        await User.create({ ...userData, imageUrl, imageDelPath })
        await image.move(app.publicPath(`${usersImgsPublicPath}`), { name: imageName })
  
        return 'Inserção de usuário realizada'
      } catch (error) {
        return (error)
      }
    } else {
      return response.status(400).send(image.errors)
    }
  }


  async update({ params, request, response }: HttpContext) {
    // Lembrar que, para limpar qualquer campo, basta enviar a key com value vazio, null.
    // Primeiro recolhemos a imagem. Caso exista, validamos quantidade, tipo, tamanho.
    const images = request.files('image', {
      size: imgSize,
      extnames: extTypes,
    })

    // Checamos se há apenas uma imagem
    if (images.length > 1) {
      return response.status(400).send('Por favor, envie apenas uma imagem para o usuário.')

    }
    const image = images[0]

    // Checamos se o usuário existe
    const user: User | null = await User.find(params.id)
    if (!user) {
      return 'Usuário não encontrado'
    }

    // atualizamos os dados
    user.fullName = request.input('fullName')
    user.email = request.input('email')
    user.password = request.input('password')

    // sem imagem adicionada, mas com url
    if (!image && request.input('imageUrl')) {
      const imageDelPath = user.imageDelPath // com isso poderemos deletar a img anterior do usuário
      user.imageUrl = request.input('imageUrl')
      await user?.save()
      // deletar possível img anterior
      deleteOldImage(imageDelPath)
      return 'Usuário atualizado'
    }

    // existe uma imagem
    if (image && image.hasErrors) { // a imagem tem erros?
      return response.status(400).send(image.errors)
    } else {
      if (image && !image.hasErrors) { // imagem não tem erros.
        if (request.input('imageUrl')) { // tem imagem, mas tbm tem URL de imagem.
          return 'Inserir apenas uma URL ou arquivo de imagem.'
        }
  
        // tudo certo, temos uma imagem validada
        const imageName = `${new Date().getTime()}.${image.extname}`
        user.imageUrl = `${usersImgsUrl}${imageName}`
        // recuperamos o caminho da imagem antiga, para deleção
        const imageDelPath = user.imageDelPath
        // atualizamos o caminho de deleção para a nova imagem
        user.imageDelPath = `${usersImgsPath}${imageName}`

        try {
          await user?.save()
          await image.move(app.publicPath(`${usersImgsPublicPath}`), { name: imageName })
          // deletamos a img anterior, caso esteja no back-end
          deleteOldImage(imageDelPath)
          return 'Usuário atualizado'
        } catch (error) {
          return error
        }
      }
    }

    // save para o caso sem alterações de imagem
    await user?.save()
    return 'Usuário atualizado'
  }


  async delete({ params }: HttpContext) {
    const user: User | null = await User.find(params.uid)
    if (user) {
      const imageDelPath = user.imageDelPath
      let cart = await Cart.findBy('uid', user.uid)
      if (cart) {
        await cart.delete()
      }
      await user.delete()
      deleteOldImage(imageDelPath)
      return 'Usuário deletado'
    }
    return 'Usuário não encontrado'
  }
}
