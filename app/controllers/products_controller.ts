import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'

async function deleteOldImage(imagePath: string) {
  const completePath = app.makePath(imagePath)
  if (fs.existsSync(completePath)) {
    fs.unlinkSync(completePath)
  }
}

export default class ProductsController {
  async indexall({}: HttpContext) {
    return await Product.all()
  }

  async indexunit({ params }: HttpContext) {
    const product: Product | null = await Product.find(params.id)
    if (!product) {
      return 'Produto não encontrado'
    }
    return product
  }

  async store({ request, response }: HttpContext) {
    const images = request.files('image', {
      size: '1mb',
      extnames: ['jpg', 'JPG', 'png', 'gif'],
    })

    // checa se tem só uma imagem
    if (images.length > 1) {
      return response.status(400).send('Envie apenas uma imagem para o produto.')
    }
    const image = images[0]

    if (!image) {
      await Product.create(request.all())
      return 'Inserção de produto realizada'
    }

    if (!image.hasErrors) {
      if (request.input('imageUrl')) {
        return 'Inserir apenas uma URL ou arquivo de imagem.'
      }

      const imageName = `${new Date().getTime()}.${image.extname}`
      const imageUrl = `public/uploads/productsImgs/${imageName}`
      const productData = request.only(['name', 'description', 'price', 'quantity'])
      await Product.create({ ...productData, imageUrl })
      await image.move(app.publicPath('uploads/productsImgs'), { name: imageName })

      return 'Inserção de produto realizada'
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
      return response.status(400).send('Por favor, envie apenas uma imagem para o produto.')
    }
    const image = images[0]

    const product: Product | null = await Product.find(params.id)
    if (!product) {
      return 'Produto não encontrado'
    }
    product.name = request.input('name')
    product.description = request.input('description')
    product.price = request.input('price')
    product.quantity = request.input('quantity')

    if (!image && request.input('imageUrl')) {
      const oldPath = product.imageUrl
      product.imageUrl = request.input('imageUrl')
      await product?.save()
      // deletar possível img anterior
      deleteOldImage(oldPath)
      return 'Produto atualizado'
    }

    // existe uma imagem, sem erros, com erros
    if (image && !image.hasErrors) {
      // tem imagem, mas tbm tem URL de imagem
      if (request.input('imageUrl')) {
        return 'Inserir apenas uma URL ou arquivo de imagem.'
      }

      // tem apenas a imagem, validada
      const imageName = `${new Date().getTime()}.${image.extname}`
      const imageUrl = `public/uploads/productsImgs${imageName}`
      const oldPath = product.imageUrl
      product.imageUrl = imageUrl
      await product?.save()
      await image.move(app.publicPath('uploads/productsImgs'), { name: imageName })
      // deletar possível img anterior
      deleteOldImage(oldPath)
      return 'Produto atualizado'
    } else {
      // situação de img com erros
      if (image && image.hasErrors) {
        return response.status(400).send(image.errors)
      }
    }
    await product?.save()
    return 'Produto atualizado'
  }

  async destroy({ params }: HttpContext) {
    const product: Product | null = await Product.find(params.id)
    if (product) {
      const oldPath = product.imageUrl
      await product.delete()
      deleteOldImage(oldPath)
      return 'Produto deletado'
    }
    return 'Produto não encontrado'
  }
}
