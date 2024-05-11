// eslint-disable-next-line @adonisjs/prefer-lazy-controller-import
import ProductsController from '#controllers/products_controller'
// eslint-disable-next-line @adonisjs/prefer-lazy-controller-import
import UsersController from '#controllers/users_controller'
import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('/api/users/list', [UsersController, 'indexall'])
router.post('/api/users/store', [UsersController, 'store'])
router.get('/api/users/:id', [UsersController, 'indexunit'])
router.put('/api/users/:id', [UsersController, 'update'])
router.delete('/api/users/:id', [UsersController, 'destroy'])

router.get('/api/products/list', [ProductsController, 'indexall'])
router.post('/api/products/store', [ProductsController, 'store'])
router.get('/api/products/:id', [ProductsController, 'indexunit'])
router.put('/api/products/:id', [ProductsController, 'update'])
router.delete('/api/products/:id', [ProductsController, 'destroy'])
