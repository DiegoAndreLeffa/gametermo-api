import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Loldle Game API')
    .setDescription('API completa para o jogo estilo Termo/Loldle com modos Multiplayer e Ranking.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticação e Registro')
    .addTag('Content', 'Gerenciamento de Temas e Entidades (LoL, Valorant, etc)')
    .addTag('Gameplay', 'Mecânicas de jogo, chutes e sessões')
    .addTag('Rooms', 'Sistema de Salas Multiplayer')
    .addTag('Leaderboard', 'Rankings Globais e de Salas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableCors({
    origin: ['https://gametermo-front.vercel.app'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
