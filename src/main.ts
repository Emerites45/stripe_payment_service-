import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  // rawBody: true est indispensable pour vérifier la signature des webhooks Stripe
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Payment Service')
    .setDescription(
      'Service de paiement (Stripe sandbox) : dépôts, retraits, webhooks et historique des transactions.',
    )
    .setVersion('1.0.0')
    .addTag('payments', 'Dépôts (encaissements)')
    .addTag('payouts', 'Retraits (transferts et payouts)')
    .addTag('transactions', "Historique et traçabilité")
    .addTag('webhooks', 'Réception des événements Stripe')
    .addTag('health', 'Supervision (Eureka)')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 payment-service démarré sur le port ${port}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Documentation Swagger disponible sur http://localhost:${port}/docs`);
}

bootstrap();
