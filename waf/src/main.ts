import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`WAF Reverse Proxy running on port ${port}`);
  console.log(`Target URL: ${process.env.TARGET_URL || 'http://localhost:3001'}`);
  console.log(`Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
}
bootstrap();
