export type HealthComponentStatus = 'ok' | 'error';

export interface HealthChecksDto {
  db: HealthComponentStatus;
  queue: HealthComponentStatus;
}

export interface HealthResponseDto {
  status: HealthComponentStatus;
  checks: HealthChecksDto;
}
