'use strict'

const Hapi = require('hapi')
const Boom = require('boom')
const jsonwebtoken = require('jsonwebtoken')

/**
 * Environment Variables:
 * In a real scenario get them using process.env
 */

const JWT_SECRET = 'ABRACADABRA'

/**
 * Server Initialization
 */

const init = async () => {
  const server = Hapi.server({ port: 3000 })

  await server.register(require('hapi-auth-jwt2'))

  server.auth.strategy('my-jwt-strategy', 'jwt', {
    key: JWT_SECRET,
    validate: validateJWT,
    verifyOptions: { algorithms: ['HS256'] },
  })

  /**
   * Routes
   */

  server.route({ method: 'POST', path: '/auth', config: { cors: true, auth: false }, handler: handleAuth })
  server.route({ method: 'GET', path: '/me', config: { cors: true, auth: 'my-jwt-strategy' }, handler: handleMe })

  /**
   * Fake users and passwords
   */

  const fakeUsers = {
    jorge: {
      id: 1234,
      password: 'secreto',
    },
    marta: {
      id: 5678,
      password: 'misterio',
    },
  }

  /**
   * Route Handlers
   */

  function handleAuth(request) {
    console.log('request', request.payload)
    const { username, password } = JSON.parse(request.payload)

    const user = fakeUsers[username]

    if (!user || user.password !== password) {
      return Boom.unauthorized()
    }

    try {
      const jwt = jsonwebtoken.sign({ sub: user.id, username }, JWT_SECRET)
      return { jwt }
    } catch (err) {
      return Boom.unauthorized()
    }
  }

  // If the user does not present

  function handleMe(request) {
    const { credentials } = request.auth
    console.log(credentials)

    const user = Object.assign({}, fakeUsers[credentials.username])
    delete user.password

    return user
  }

  await server.start()

  console.log(`Server running at: ${server.info.uri}`)
}

process.on('unhandledRejection', err => {
  console.log(err)
  process.exit(1)
})

init()

/**
 * Helpers
 */

function validateJWT(decodedToken) {
  if (!decodedToken) {
    return { isValid: false }
  }

  return { isValid: true, credentials: decodedToken }
}
