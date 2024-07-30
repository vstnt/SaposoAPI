import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uid: string

  @column()
  declare source: string

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare password: string | null

  @column()
  declare imageUrl: string | null

  @column()
  declare imageDelPath: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static refreshTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '15m',
    table: 'refresh_tokens',
  })
}


// Por padrão, o nome da tabela é inferido a partir do nome do modelo. Por exemplo, se o modelo se chama User,
// o AdonisJS assume que a tabela correspondente no banco de dados se chama users. No entanto, é possível especificar
//  explicitamente o nome da tabela no modelo, caso seja necessário.
