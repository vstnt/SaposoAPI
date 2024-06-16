import AuthController from '#controllers/auth_controller'
import CategoriesController from '#controllers/categories_controller'
import OrdersController from '#controllers/orders_controller'
import ProductCategoriesController from '#controllers/product_categories_controller'
import ProductsController from '#controllers/products_controller'
import UsersController from '#controllers/users_controller'
import CartsController from '#controllers/carts_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})


// Autenticação de usuário
router.post('/api/signin', [AuthController, 'signin'])
router.post('/api/validate', [AuthController, 'validateToken']).use(middleware.auth({guards: ['api']}))
router.post('/api/logout', [AuthController, 'logout']).use(middleware.auth({guards: ['api']}))

// Usuários e registro
router.get('/api/users', [UsersController, 'indexall'])
router.post('/api/register', [UsersController, 'store'])
router.get('/api/users/:id', [UsersController, 'indexunit'])
router.put('/api/users/:id', [UsersController, 'update'])
router.delete('/api/users/:id', [UsersController, 'destroy'])

// Produtos
router.get('/api/products', [ProductsController, 'indexall'])
router.post('/api/products', [ProductsController, 'store'])
router.get('/api/products/newest', [ProductsController, 'newest'])
router.get('/api/products/search', [ProductsController, 'search'])
router.get('/api/products/:id', [ProductsController, 'indexunit'])
router.put('/api/products/:id', [ProductsController, 'update'])
router.delete('/api/products/:id', [ProductsController, 'destroy'])
router.get('/api/products/top-selling', [ProductsController, 'topSelling'])

// Pedidos
router.post('api/orders', [OrdersController, 'store'])
router.get('api/orders', [OrdersController, 'indexorders'])
router.get('api/ordersitems', [OrdersController, 'indexordersitems'])
router.post('api/orders/delete', [OrdersController, 'deleteOrder'])

// Categorias de produtos
router.get('api/productscategories', [ProductCategoriesController, 'indexProductsCategories'])
router.get('api/categories', [CategoriesController, 'index'])
router.post('api/categories', [CategoriesController, 'store'])

// Carrinhos de compras
router.get('api/carts', [CartsController, 'indexCarts'])
router.get('api/cartsitems', [CartsController, 'indexCartsItems'])
router.post('api/carts/create', [CartsController, 'createCart'])
router.post('api/carts/delete', [CartsController, 'deleteCart'])

router.get('api/cart', [CartsController, 'viewCart']).use(middleware.auth({guards: ['api']}))
router.post('api/cart/updateitem', [CartsController, 'updateItem']).use(middleware.auth({guards: ['api']}))
router.post('api/cart/deleteitem', [CartsController, 'deleteItem']).use(middleware.auth({guards: ['api']}))
router.get('api/cart/clear', [CartsController, 'clearCart']).use(middleware.auth({guards: ['api']}))


