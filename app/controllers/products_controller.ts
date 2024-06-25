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

    // checa se não há mais de uma imagem
    if (images.length > 1) {
      return response.status(400).send('Envie apenas uma imagem para o produto.')
    }
    const image = images[0]

    // caso não exista imagem
    if (!image) {
      await Product.create(request.all()) // falta a validação pra uma imagem por url.
      return 'Inserção de produto realizada'
    }

    // há uma imagem. Ela tem erros?
    if (image.hasErrors) {
      return response.status(400).send(image.errors)
    } else { // imagem sem erros. Há também uma url de imagem?
      if (request.input('imageUrl')) {
        return 'Inserir apenas uma URL ou arquivo de imagem.'
      }

      // Há uma img, validada e sem erros
      const imageName = `${new Date().getTime()}.${image.extname}`
      const imageUrl = `${productsImgsUrl}${imageName}`
      const imageDelPath = `${productsImgsPath}${imageName}`
      const productData = request.only(['name', 'description', 'price', 'quantity'])
      await Product.create({ ...productData, imageUrl, imageDelPath })
      await image.move(app.publicPath(`${productsImgsPublicPath}`), { name: imageName })

      return 'Inserção de produto realizada'    }
  }


  async update({ params, request, response }: HttpContext) {
    // Para limpar qualquer campo do produto, basta enviar a key com value vazio, null.
    // primeiro recolhemos a imagem. Caso exista, validamos quantidade, tipo, tamanho.
    const images = request.files('image', {
      size: imgSize,
      extnames: extTypes,
    })
    // checa se não há mais de uma imagem
    if (images.length > 1) {
      return response.status(400).send('Por favor, envie apenas uma imagem para o produto.')
    }
    const image = images[0]

    const product: Product | null = await Product.find(params.id)
    if (!product) {
      return 'Produto não encontrado'
    }

    // atualizamos os dados do produto, depois a imagem
    product.name = request.input('name')
    product.description = request.input('description')
    product.price = request.input('price')
    product.quantity = request.input('quantity')

    if (!image && request.input('imageUrl')) { // há apenas uma url de imagem
      const imageDelPath = product.imageDelPath
      product.imageUrl = request.input('imageUrl')
      await product?.save()
      // deletar possível img anterior
      deleteOldImage(imageDelPath)
      return 'Produto atualizado'
    }

    // existe uma imagem, ela tem erros?
    if (image && image.hasErrors) {
      return response.status(400).send(image.errors)
    } else if (image && !image.hasErrors) { // a imagem não tem erros
      if (request.input('imageUrl')) { // há também uma url de imagem?
        return 'Inserir apenas uma URL ou arquivo de imagem.'
      }
      // temos apenas a imagem, validada
      const imageName = `${new Date().getTime()}.${image.extname}`
      product.imageUrl = `${productsImgsUrl}${imageName}`
      const imageDelPath = product.imageDelPath // recuperamos o caminho da imagem antiga, para deleção
      product.imageDelPath = `${productsImgsPath}${imageName}` // atualizamos o caminho de deleção para a nova imagem

      await product?.save()
      await image.move(app.publicPath(`${productsImgsPublicPath}`), { name: imageName })
      deleteOldImage(imageDelPath) // deletamos a img anterior, caso esteja no back-end
      return 'Produto atualizado'
    }

    // save para o caso sem alterações de imagem
    await product?.save()
    return 'Produto atualizado'
  }


  async delete({ params }: HttpContext) {
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
