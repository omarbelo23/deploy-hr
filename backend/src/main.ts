import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config } from 'dotenv';
config();   // ← add this line

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // // Serve static files from uploads directory
  // app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  //   prefix: '/uploads/',
  // });

  // ★ allow frontend origin + credentials (cookies)
  app.enableCors({
    origin: ['http://localhost:3000', 'https://rry-hr-system.netlify.app'],

    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(4000);
  console.log('Nest running on http://localhost:4000  🚀');
}
bootstrap();
