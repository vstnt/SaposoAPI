import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import app from '@adonisjs/core/services/app'

export default class ProductsController {
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {
    return await Product.all()
  }

  async index2({ params }: HttpContext) {
    const product: Product | null = await Product.find(params.id)
    if (!product) {
      return 'Produto não encontrado'
    }
    return product
  }

  async store({ request, response }: HttpContext) {
    const image = request.file('image', {
      size: '2mb',
      extnames: ['jpg', 'png', 'gif'],
    })

    if (!image) {
      const product: Product = await Product.create(request.all())
      product
      return 'Inserção realizada'
    }

    if (image && !image.hasErrors) {
      const imageName = `${new Date().getTime()}.${image.extname}`
      await image.move(app.publicPath('uploads'), { name: imageName })
      const imageUrl = `public/uploads/${imageName}`

      const productData = request.only(['name', 'description', 'price', 'quantity'])
      const product: Product = await Product.create({ ...productData, imageUrl })
      product // só pra ele parar de reclamar
      return product
    } else {
      return response.status(400).send(image.errors)
    }
  }

  async update({ params, request }: HttpContext) {
    const product: Product | null = await Product.find(params.id)
    if (!product) {
      return 'Produto não encontrado'
    }
    product.name = request.input('name')
    product.description = request.input('description')
    product.price = request.input('price')
    product.quantity = request.input('quantity')
    product.imageUrl = request.input('imageUrl')

    await product?.save()
    return product
  }

  async destroy({ params }: HttpContext) {
    const product: Product | null = await Product.find(params.id)
    if (product) {
      await product.delete()
      return 'Produto deletado'
    }
    return 'Produto não encontrado'
  }
}
