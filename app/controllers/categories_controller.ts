import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import vine from '@vinejs/vine'

export default class CategoriesController {
  async index({ response }: HttpContext) {
    const categories = await Category.all()
    return response.ok(categories)
  }

  async store({ request, response }: HttpContext) {
    const categorySchema = vine.object({
      name: vine.string(),
    })

    const categoriesSchema = vine.array(categorySchema)

    const payload = await vine.validate({
      schema: categoriesSchema,
      data: request.all(),
    })

    const categories = await Category.createMany(payload)
    return response.created(categories)
  }

  async show({ params, response }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    return response.ok(category)
  }

  async update({ params, request, response }: HttpContext) {
    const categorySchema = vine.object({
      name: vine.string(),
    })

    const payload = await vine.validate({
      schema: categorySchema,
      data: request.all(),
    })

    const category = await Category.findOrFail(params.id)
    category.merge(payload)
    await category.save()
    return response.ok(category)
  }

  async destroy({ params, response }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    await category.delete()
    return response.noContent()
  }
}
