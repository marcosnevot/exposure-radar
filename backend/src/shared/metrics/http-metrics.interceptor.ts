/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ObservabilityService } from '../../modules/observability/observability.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly observabilityService: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = process.hrtime.bigint();

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<FastifyRequest>();

    return next.handle().pipe(
      tap({
        next: () => {
          const reply = httpContext.getResponse<FastifyReply>();
          this.recordMetrics(request, reply.statusCode, now);
        },
        error: (err: unknown) => {
          const reply = httpContext.getResponse<FastifyReply>();
          const statusCode =
            (err as any)?.status ??
            (err as any)?.statusCode ??
            reply?.statusCode ??
            500;

          this.recordMetrics(request, statusCode, now);
        },
      }),
    );
  }

  private recordMetrics(
    request: FastifyRequest,
    statusCode: number,
    startedAt: bigint,
  ): void {
    const diffNs = Number(process.hrtime.bigint() - startedAt);
    const durationSeconds = diffNs / 1e9;

    const route =
      (request as any).routerPath ??
      (request as any).routeOptions?.url ??
      request.url ??
      'unknown';

    this.observabilityService.recordHttpRequest(
      route,
      request.method,
      statusCode,
      durationSeconds,
    );
  }
}
