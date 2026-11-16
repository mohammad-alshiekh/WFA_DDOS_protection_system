import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;

  public requestsTotal: client.Counter;
  public blockedByReason: client.Counter;
  public processingDuration: client.Histogram;
  public activeConnections: client.Gauge;

  onModuleInit() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    this.requestsTotal = new client.Counter({
      name: 'waf_requests_total',
      help: 'Total requests processed by WAF',
      labelNames: ['status', 'method', 'path'],
      registers: [this.register],
    });

    this.blockedByReason = new client.Counter({
      name: 'waf_blocked_by_reason',
      help: 'Blocked requests by reason',
      labelNames: ['reason', 'ip'],
      registers: [this.register],
    });

    this.processingDuration = new client.Histogram({
      name: 'waf_processing_duration_seconds',
      help: 'Time spent processing requests',
      labelNames: ['status'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.register],
    });

    this.activeConnections = new client.Gauge({
      name: 'waf_active_connections',
      help: 'Number of active connections',
      registers: [this.register],
    });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
