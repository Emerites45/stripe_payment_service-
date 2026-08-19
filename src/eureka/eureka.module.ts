import { Global, Module } from '@nestjs/common';
import { EurekaClientService } from './eureka.service';

@Global()
@Module({
  providers: [EurekaClientService],
  exports: [EurekaClientService],
})
export class EurekaModule {}
