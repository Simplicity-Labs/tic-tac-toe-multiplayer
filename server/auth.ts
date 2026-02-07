import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous, magicLink } from 'better-auth/plugins'
import { google } from 'better-auth/social-providers'
import { db } from './db'
import * as schema from './db/schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || 'http://localhost:3100',
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production',
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  },
  plugins: [
    anonymous(),
    magicLink({
      // Magic link will send passwordless login emails
      sendMagicLink: async ({ email, url, token }) => {
        // For now, log to console - in production you'd send via email service
        console.log(`Magic Link for ${email}: ${url}`)
        // You could integrate with email providers like Resend, SendGrid, etc.
        // await emailService.send({
        //   to: email,
        //   subject: 'Sign in to Tic Tac Toe',
        //   text: `Click here to sign in: ${url}`
        // })
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  trustedOrigins: [
    // Development
    'http://localhost:5173',
    'http://localhost:3100',
    // Production
    'https://tictactoe.simplicitylabs.io',
    // Dynamic from environment
    process.env.APP_URL || 'http://localhost:3100',
  ],
})