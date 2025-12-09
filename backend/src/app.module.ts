import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ObservabilityModule } from './modules/observability/observability.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                },
              }
            : undefined,
        redact: ['req.headers.authorization'],
      },
    }),
    InfraModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
