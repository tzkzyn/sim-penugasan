import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
