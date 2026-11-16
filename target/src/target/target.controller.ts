import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TargetService } from './target.service';

@Controller()
export class TargetController {
  constructor(private targetService: TargetService) {}

  @Get()
  home() {
    return { 
      message: 'Welcome to the Target Server', 
      status: 'ok',
      endpoints: ['/', '/health', '/api/data', '/login', '/heavy'],
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  health() {
    return { 
      status: 'healthy', 
      service: 'target', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString() 
    };
  }

  @Get('api/data')
  async getData(@Query('delay') delay: string) {
    const delayMs = parseInt(delay) || 0;
    if (delayMs > 0 && delayMs < 10000) {
      await this.targetService.sleep(delayMs);
    }
    return {
      data: Array.from({ length: 10 }, (_, i) => ({ 
        id: i, 
        value: Math.random().toString(36).substring(2, 8),
        timestamp: new Date().toISOString()
      })),
      processed: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('login')
  async login(@Body() body: { username?: string; password?: string }) {
    await this.targetService.sleep(50 + Math.random() * 100);
    return {
      success: true,
      message: 'Login simulated',
      received: body,
      sessionId: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('heavy')
  async heavy() {
    const result = this.targetService.cpuIntensive();
    return {
      result: result.toFixed(2),
      iterations: 1000000,
      timestamp: new Date().toISOString(),
    };
  }
}
