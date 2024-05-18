import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating
 * a new order.
 */
export const createOrderValidator = vine.object({
  userId: vine.number(),
  items: vine.array(
    vine.object({
      productId: vine.number(),
      quantity: vine.number(),
      price: vine.number(),
    })
  ),
  total: vine.number(),
  status: vine.string(),
})


/**
 * Validator to validate the payload when updating
 * an existing order.
 */
export const updateOrderValidator = vine.compile(
  vine.object({})
)
