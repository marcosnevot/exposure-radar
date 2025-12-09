import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    const url =
      this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.client = new Redis(url, {
      lazyConnect: true,
    });

    this.client.on('error', (err: unknown) => {
      this.logger.error('Redis client error', err as Error);
    });
  }

  async ping(): Promise<string> {
    if (this.client.status === 'end') {
      await this.client.connect();
    }

    return this.client.ping();
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
