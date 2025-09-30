import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança básica e DX
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos extras
      forbidNonWhitelisted: true,
      transform: true, // transforma payloads nos DTOs
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Global BI Back')
    .setDescription('API do Global BI')
    .setVersion('1.0.0')
    .addBearerAuth() // já deixa pronto pro JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Porta via .env (fallback 8000)
  const cfg = app.get(ConfigService);
  const port = cfg.get<number>('PORT') ?? 8000;

  await app.listen(port);
  console.log(`🚀 Server on http://localhost:${port}`);
  console.log(`📘 Swagger on http://localhost:${port}/docs`);
}

void bootstrap();
