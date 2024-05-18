import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import db from '@adonisjs/lucid/services/db'
import { createOrderValidator } from '#validators/order'
import vine from '@vinejs/vine'

export default class OrdersController {
  async indexorders({}: HttpContext) {
    return await Order.all()
  }

  async indexordersitems({}: HttpContext) {
    return await OrderItem.all()
  }

  async store ({request, response}: HttpContext) {
    // agora vamos usar transação, para garantir de que se alguma parte falhar, a transação será revertida e não feita pela metade
    const trx = await db.transaction()

    try {
      // Valida a requisição
      const payload = await vine.validate({
        schema: createOrderValidator,
        data: request.all(),
      })


      const { userId, items, total, status } = payload

      // Cria a ordem
      const order = await Order.create({ userId, total, status }, { client: trx })

      // Cria os items da ordem
      for  (const item of items) {
        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        }, { client: trx })
      }

      await trx.commit()
      return response.status(201).json(order)
    } catch (error) {
      await trx.rollback
      return response.status(400).json({ message: 'Erro ao criar ordem de pedido', error })
    }

    // É importante validar os dados de entrada para garantir que userId e items estão presentes e são válidos.

  }





}
