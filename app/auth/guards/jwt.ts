// código feito com base na doc do adonis ("custom auth guard")
import { symbols, errors } from '@adonisjs/auth'
import { AuthClientResponse, GuardContract } from '@adonisjs/auth/types'
import jwt from 'jsonwebtoken'
import type { HttpContext } from '@adonisjs/core/http'
import admin from '#start/firebaseAdmin'


// The bridge between the User provider and the Guard
export type JwtGuardUser<RealUser> = {
  getId(): string | number | BigInt
  getOriginal(): RealUser
}

// The interface for the UserProvider accepted by the JWT guard.
export interface JwtUserProviderContract<RealUser> {
  [symbols.PROVIDER_REAL_USER]: RealUser
  createUserForGuard(user: RealUser): Promise<JwtGuardUser<RealUser>>
  findById(identifier: string | number | BigInt): Promise<JwtGuardUser<RealUser> | null>
}

// Tipo para opções do guard
export type JwtGuardOptions = {
  secret: string
}



export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  #ctx: HttpContext
  #userProvider: UserProvider
  #options: JwtGuardOptions
  declare [symbols.GUARD_KNOWN_EVENTS]: {}
  driverName: 'jwt' = 'jwt'
  authenticationAttempted: boolean = false
  isAuthenticated: boolean = false
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER]

  constructor(
    ctx: HttpContext,
    userProvider: UserProvider,
    options: JwtGuardOptions
  ) {
    this.#ctx = ctx
    this.#userProvider = userProvider
    this.#options = options
  }


  // Generate a JWT token for a given user.
  async generate(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER],
    expiresIn: string | number = '30m' // Define o tempo de expiração padrão para 30m
  ) {
    const providerUser = await this.#userProvider.createUserForGuard(user)
    const token = jwt.sign({ userId: providerUser.getId() }, this.#options.secret, { expiresIn })

    return {
      type: 'bearer',
      token: token
    }
  }


  /*Authenticate the current HTTP request and return
   the user instance if there is a valid JWT token
   or throw an exception */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    // Avoid re-authentication when it has been done already for the given request
    if (this.authenticationAttempted) {
      return this.getUserOrFail()
    }
    this.authenticationAttempted = true

    // Ensure the auth header exists
    const authHeader = this.#ctx.request.header('authorization')
    if (!authHeader) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    // Split the header value and read the token from it
    const [, token] = authHeader.split('Bearer ')
    if (!token) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    // Verify token source
    const tokenOrigin = this.#ctx.request.header('tokenOrigin')

    if (tokenOrigin == 'firebase') {
      try {
        const firebaseUser = await admin.auth().verifyIdToken(token)
        this.user = { uid: firebaseUser.uid, source: 'firebase' } as UserProvider[typeof symbols.PROVIDER_REAL_USER] // ???
        return this.getUserOrFail() // ???
      } catch (error) {
        throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
          guardDriverName: this.driverName,
        })
      }

    } else {
      // Verify JWT token
      const payload = jwt.verify(token, this.#options.secret)
      if (typeof payload !== 'object' || !('userId' in payload)) {
        throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
          guardDriverName: this.driverName,
        })
      }

      // Fetch the user by user ID and save a reference to it
      const providerUser = await this.#userProvider.findById(payload.userId)
      if (!providerUser) {
        throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
          guardDriverName: this.driverName,
        })
      }

      this.user = providerUser.getOriginal()
      return this.getUserOrFail()
    }
  }


  //Same as authenticate, but does not throw an exception
  async check(): Promise<boolean> {
    try {
      await this.authenticate()
      return true
    } catch {
      return false
    }
  }


  /*Returns the authenticated user or throws an error */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    return this.user
  }


  /*The authenticateAsClient method is used during tests when you want to login a user during tests via the loginAs method. For the JWT implementation, this method should return the authorization header containing the JWT token.
  This method is called by Japa during testing when "loginAs" method is used to login the user. */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    const token = await this.generate(user)
    return {
      headers: {
        authorization: `Bearer ${token.token}`,
      },
    }
  }

}
