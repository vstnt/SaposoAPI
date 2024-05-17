import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import app from '@adonisjs/core/services/app'
import { deleteOldImage, extTypes, imgSize, productsImgsPath, productsImgsPublicPath, productsImgsUrl } from './exports.js'
import db from '@adonisjs/lucid/services/db'
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
      size: imgSize,
      extnames: extTypes,
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

      // chegamos aqui caso contenha img, validada e sem erros
      const imageName = `${new Date().getTime()}.${image.extname}`
      const imageUrl = `${productsImgsUrl}${imageName}`
      const imageDelPath = `${productsImgsPath}${imageName}`
      const productData = request.only(['name', 'description', 'price', 'quantity'])
      await Product.create({ ...productData, imageUrl, imageDelPath })
      await image.move(app.publicPath(`${productsImgsPublicPath}`), { name: imageName })

      return 'Inserção de produto realizada'
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
      const imageDelPath = product.imageDelPath
      product.imageUrl = request.input('imageUrl')
      await product?.save()
      // deletar possível img anterior
      deleteOldImage(imageDelPath)
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
      product.imageUrl = `${productsImgsUrl}${imageName}`
      // recuperamos o caminho da imagem antiga, para deleção
      const imageDelPath = product.imageDelPath
      // atualizamos o caminho de deleção para a nova imagem
      product.imageDelPath = `${productsImgsPath}${imageName}`
      await product?.save()
      await image.move(app.publicPath(`${productsImgsPublicPath}`), { name: imageName })
      // deletamos a img anterior, caso esteja no back-end
      deleteOldImage(imageDelPath)

      return 'Produto atualizado'
    } else {
      // situação de img com erros
      if (image && image.hasErrors) {
        return response.status(400).send(image.errors)
      }
    }

    // save para o caso sem alterações de imagem
    await product?.save()
    return 'Produto atualizado'
  }

  async destroy({ params }: HttpContext) {
    const product: Product | null = await Product.find(params.id)
    if (product) {
      const imageDelPath = product.imageDelPath
      await product.delete()
      deleteOldImage(imageDelPath)
      return 'Produto deletado'
    }
    return 'Produto não encontrado'
  }

  async topSelling({ response }: HttpContext) {
    const products = await db
      .from('order_items')
      .select('product_id')
      .sum('quantity as total_sold')
      .groupBy('product_id')
      .orderBy('total_sold', 'desc')
      .limit(5)
      .innerJoin('products', 'order_items.product_id', 'products.id')

    return response.json(products)
  }

  async newest({ response }: HttpContext) {
    const products = await Product.query()
      .orderBy('createdAt', 'desc')
      .limit(5)

    return response.json(products)
  }

  async search({ request, response }: HttpContext) {
    const { term, category } = request.qs()

    const query = Product.query()

    if (term) {
      query.where('name', 'like', `%${term}%`).orWhere('description', 'like', `%${term}%`)
    }

    if (category) {
      query.whereHas('categories', (categoryQuery) => {
        categoryQuery.where('name', category)
      })
    }

    const products = await query.exec()

    return response.json(products)
  }
}
