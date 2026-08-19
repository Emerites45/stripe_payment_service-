export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  eureka: {
    host: process.env.EUREKA_HOST ?? 'discovery-service',
    port: parseInt(process.env.EUREKA_PORT ?? '8761', 10),
    serviceName: (process.env.SERVICE_NAME ?? 'payment-service').toUpperCase(),
    serviceHost: process.env.SERVICE_HOST ?? 'payment-service',
    servicePort: parseInt(process.env.SERVICE_PORT ?? '3000', 10),
    startDelayMs: parseInt(process.env.EUREKA_START_DELAY_MS ?? '5000', 10),
  },
});
