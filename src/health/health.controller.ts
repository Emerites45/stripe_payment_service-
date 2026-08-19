import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'UP', timestamp: Date.now(), service: 'payment-service' };
  }

  @Get('info')
  info() {
    return { app: 'PAYMENT-SERVICE', version: '1.0.0', build: { time: Date.now() } };
  }
}
