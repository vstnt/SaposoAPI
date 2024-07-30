import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import CartItem from './cart_item.js'

export default class Cart extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uid: string

  @column()
  declare total: number

  @hasMany(() => CartItem)
  public items: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}