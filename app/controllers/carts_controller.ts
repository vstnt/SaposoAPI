import type { HttpContext } from '@adonisjs/core/http'
import Cart from '#models/cart'
import CartItem from '#models/cart_item'
import Product from '#models/product'
import { TimestampKeywords } from '@adonisjs/core/types/logger'



export default class CartsController {
 
  
  async indexCarts({}: HttpContext) {
    return await Cart.all()
  }


  async indexCartsItems({}: HttpContext) {
    return await CartItem.all()
  }


  // chamado a cada login, pelo controlador do login (authController)
  async createCartLogin(userId: number) {
    // Verifica se o usuário já tem um carrinho
    let cart = await Cart.findBy('user_id', userId)
    if (!cart){
      //cria um novo carrinho
      cart = await Cart.create({userId: userId, total: 0})
    }
    return cart
  }


  async createCart({ request }: HttpContext) {
    const { user_id } = request.only(['user_id'])
    let cart = await Cart.findBy('user_id', user_id)
    if (!cart){
      await Cart.create({userId: user_id, total: 10})
    }
    return 'Carrinho criado'
  }


  async deleteCart({ request }: HttpContext) {
    const { user_id } = request.only(['user_id'])
    let cart = await Cart.findBy('user_id', user_id)
    if (cart) {
      await cart.delete()
      return 'Carrinho deletado'
    }
  }


  // método pra vizualizar o carrinho do usuário
  async viewCart({ auth }: HttpContext){
    const userId = auth.user?.id
    if (userId){
      try {
        const cart = await Cart.query().where('user_id', userId).preload('items').firstOrFail()
        const items = cart.items.map((item: { productId: number; quantity: number; price: number; createdAt: TimestampKeywords }) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          createdAt: new Date(item.createdAt).getTime(),
        }));
        return ({total:cart.total, items:items})
      } catch (error) {
        return { message: 'Carrinho não encontrado' }
      }
    } else {
      return { message: 'Sem ID de usuário' }
    }
  }


  // esse aqui serve pra adicionar e retirar quantidades variadas de um item do carrinho
  async updateItem({ request, auth }: HttpContext){
    try {
      // primeiro tratamos de obter o carrinho do usuário, o produto em questão e a quantidade alterada no carrinho.
      const userId = auth.user?.id
      const { product_id, quantity } = request.only(['product_id', 'quantity'])
      const itemQuantity = parseInt(quantity, 10); // transformamos em int e o 10 serve pra caso o valor venha como 002 por exemplo, pra ficar em base 10
      if (itemQuantity == 0) { return { message: 'Insira uma quantidade diferente de zero para o produto'} }
      if (isNaN(itemQuantity)) { return { message: 'Quantidade inválida' } }
      const cart = await Cart.findByOrFail('user_id', userId)
      const product = await Product.findOrFail(product_id)

      // então checamos se o item já não está no carrinho
      const existingItem = await CartItem.query()
        .where('cartId', cart.id)
        .andWhere('product_id', product_id)
        .first();

      // se não está, criamos um novo item no carrinho
      if(!existingItem){
        if(itemQuantity < 0) { // quantidade negativa, rejeitamos.
          return { message: 'Não é possível subtrair de um item inexistente' }
        }
        await CartItem.create({
          cartId: cart.id,
          productId: product.id,
          quantity: itemQuantity,
          price: product.price
        }) 
      // se já está, atualizamos a quantidade no carrinho
      } else { 
        existingItem.quantity += itemQuantity
        existingItem.price = product.price
        if(existingItem.quantity <= 0) { // se a quantidade de items ficar negativa ou igual a 0, excluímos o item do carrinho
          existingItem.delete()
        } else {
          await existingItem.save();
        }
      }
      // por fim, atualizamos o valor total do carrinho
      const cartItems = await CartItem.query().where('cartId', cart.id);
      cart.total = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
      await cart.save()

      return { message: 'Item atualizado no carinho' };

    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return { message: 'Carrinho ou produto não encontrado' };
      }
    throw error;
    }
  }


  async deleteItem({ request, auth }: HttpContext){
    // primeiro tratamos de obter o carrinho do usuário e o produto em questão
    const userId = auth.user?.id
    const { product_id } = request.only(['product_id'])
    const cart = await Cart.findByOrFail('user_id', userId) // preciso do cart.id pra deletar o item dele

    //achamos o item
    const cartItem = await CartItem.query()
    .where('cart_id',  cart.id)
    .andWhere('product_id', product_id)
    .first();
    
    // atualizamos o valor do carrinho e removemos o item do carrinho
    if(cartItem){
      cart.total -= cartItem.price * cartItem.quantity;
      cart.save()
      cartItem.delete()
      return { message: 'Item removido' };
    }
    return { message: 'Falha na remoção' };
  }


  async clearCart({ auth }: HttpContext) {
    const userId = auth.user?.id;
    if (userId) {
      try {
        const cart = await Cart.query().where('user_id', userId).preload('items').firstOrFail();
        await cart.related('items').query().delete();
        cart.total = 0
        cart.save()
        return { message: 'Carrinho limpo com sucesso' };
      } catch (error) {
        return { message: 'Carrinho não encontrado' };
      }
    } else {
      return { message: 'Sem ID de usuário' };
    }
  }


}