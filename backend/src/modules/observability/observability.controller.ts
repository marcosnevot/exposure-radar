import { Controller, Get, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ObservabilityService } from './observability.service';

@Controller()
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get('health')
  async getHealth(@Res() reply: FastifyReply): Promise<void> {
    const result = await this.observabilityService.getHealth();

    reply.status(result.httpStatus).send(result.payload);
  }

  @Get('metrics')
  async getMetrics(@Res() reply: FastifyReply): Promise<void> {
    const body = await this.observabilityService.getMetrics();
    const contentType = this.observabilityService.getMetricsContentType();

    reply.header('Content-Type', contentType).send(body);
  }
}
