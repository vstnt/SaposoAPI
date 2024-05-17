import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import Category from './category.js'
import OrderItem from './order_item.js'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare price: number

  @column()
  declare quantity: number

  @column()
  declare imageUrl: string

  @column()
  declare imageDelPath: string

  @hasMany(() => OrderItem)
  public items: any

  @manyToMany(() => Category, {
    pivotTable: 'product_categories', // Nome da tabela de associação
  })
  declare categories: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
