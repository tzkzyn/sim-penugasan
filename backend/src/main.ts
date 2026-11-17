import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '20mb' });
  app.useBodyParser('urlencoded', { limit: '20mb', extended: true });
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT || process.env.npm_config_port || 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`Backend NestJS berjalan di: http://localhost:${port}/api`);
}
bootstrap();
