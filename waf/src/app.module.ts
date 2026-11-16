import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { WafModule } from './waf/waf.module';
import { WafMiddleware } from './waf/waf.middleware';
import { HealthController } from './health/health.controller';

@Module({
  imports: [WafModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WafMiddleware).forRoutes('*');
  }
}
