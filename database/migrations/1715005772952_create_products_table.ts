import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 80).notNullable()
      table.text('description').notNullable()
      table.decimal('price', 12, 2).notNullable()
      table.integer('quantity').unsigned().defaultTo(0)
      table.string('image_url').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
