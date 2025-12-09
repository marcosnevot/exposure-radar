import { Injectable, Logger } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  register,
} from 'prom-client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { HealthChecksDto, HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestsTotal: Counter<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    collectDefaultMetrics({ register });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['route', 'method', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['route', 'method', 'status'],
    });
  }

  async getHealth(): Promise<{
    httpStatus: number;
    payload: HealthResponseDto;
  }> {
    const checks: HealthChecksDto = {
      db: 'error',
      queue: 'error',
    };

    // DB check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = 'ok';
    } catch (error) {
      this.logger.error('DB healthcheck failed', error as Error);
    }

    // Redis check
    try {
      await this.redis.ping();
      checks.queue = 'ok';
    } catch (error) {
      this.logger.error('Redis healthcheck failed', error as Error);
    }

    const allOk = checks.db === 'ok' && checks.queue === 'ok';
    const httpStatus = allOk ? 200 : 503;

    return {
      httpStatus,
      payload: {
        status: allOk ? 'ok' : 'error',
        checks,
      },
    };
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  getMetricsContentType(): string {
    return register.contentType;
  }

  recordHttpRequest(
    route: string,
    method: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const statusLabel = String(statusCode);
    const labels: [string, string, string] = [route, method, statusLabel];

    this.httpRequestDuration.labels(...labels).observe(durationSeconds);
    this.httpRequestsTotal.labels(...labels).inc();
  }
}
