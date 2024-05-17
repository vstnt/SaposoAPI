// eslint-disable-next-line @adonisjs/prefer-lazy-controller-import
import OrdersController from '#controllers/orders_controller'
import ProductsController from '#controllers/products_controller'
// eslint-disable-next-line @adonisjs/prefer-lazy-controller-import
import UsersController from '#controllers/users_controller'
import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('/api/users', [UsersController, 'indexall'])
router.post('/api/users', [UsersController, 'store'])
router.get('/api/users/:id', [UsersController, 'indexunit'])
router.put('/api/users/:id', [UsersController, 'update'])
router.delete('/api/users/:id', [UsersController, 'destroy'])

router.get('/api/products', [ProductsController, 'indexall'])
router.post('/api/products', [ProductsController, 'store'])
router.get('/api/products/newest', [ProductsController, 'newest'])
router.get('/api/products/search', [ProductsController, 'search'])
router.get('/api/products/:id', [ProductsController, 'indexunit'])
router.put('/api/products/:id', [ProductsController, 'update'])
router.delete('/api/products/:id', [ProductsController, 'destroy'])
router.get('/api/products/top-selling', [ProductsController, 'topSelling'])

router.post('api/orders', [OrdersController, 'store'])

