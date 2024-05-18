import type { HttpContext } from '@adonisjs/core/http'
import ProductCategory from '#models/product_category'


export default class ProductCategoriesController {

  async indexProductsCategories({}: HttpContext) {
    return await ProductCategory.all()
  }
}

