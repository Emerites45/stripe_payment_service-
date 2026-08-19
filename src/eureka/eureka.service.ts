import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Eureka } from 'eureka-js-client';

@Injectable()
export class EurekaClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EurekaClientService.name);
  private readonly client: Eureka;
  private readonly serviceName: string;
  private readonly startDelayMs: number;

  constructor(private readonly config: ConfigService) {
    // Utilisation de getOrThrow pour garantir à TS que la variable existe,
    // ou apport d'une valeur par défaut
    this.serviceName = this.config.getOrThrow<string>('eureka.serviceName');
    this.startDelayMs = this.config.get<number>('eureka.startDelayMs', 15000);

    const serviceHost = this.config.getOrThrow<string>('eureka.serviceHost');
    const servicePort = this.config.getOrThrow<number>('eureka.servicePort');
    const eurekaHost = this.config.getOrThrow<string>('eureka.host');
    const eurekaPort = this.config.getOrThrow<number>('eureka.port');

    this.client = new Eureka({
      instance: {
        app: this.serviceName,
        hostName: serviceHost,
        ipAddr: serviceHost,
        port: {
          '$': servicePort,
          '@enabled': true,
        },
        vipAddress: serviceHost,
        statusPageUrl: `http://${serviceHost}:${servicePort}/info`,
        healthCheckUrl: `http://${serviceHost}:${servicePort}/health`,
        homePageUrl: `http://${serviceHost}:${servicePort}/`,
        metadata: {
          'management.port': String(servicePort),
          'service.type': 'payment',
          version: '1.0.0',
        },
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn',
        },
        leaseInfo: {
          renewalIntervalInSecs: 30,
          durationInSecs: 90,
        },
      },
      eureka: {
        host: eurekaHost,
        port: eurekaPort,
        servicePath: '/eureka/apps/',
        registerWithEureka: true,
        fetchRegistry: true,
        maxRetries: 10,
        requestRetryDelay: 5000,
        heartbeatInterval: 30000,
        registryFetchInterval: 30000,
        ssl: false,
      },
    });

    this.client.on('registered', () => this.logger.log(`Service ${this.serviceName} enregistré dans Eureka`));
    this.client.on('deregistered', () => this.logger.log(`Service ${this.serviceName} désenregistré d'Eureka`));
    this.client.on('heartbeat', () => this.logger.debug('Heartbeat envoyé à Eureka'));
    this.client.on('registryUpdated', () => this.logger.debug('Registre Eureka mis à jour'));
  }

  async onModuleInit() {
    await new Promise((resolve) => setTimeout(resolve, this.startDelayMs));
    this.registerWithRetry();
  }

  private registerWithRetry(retryCount = 0) {
    this.client.start((error?: Error) => {
      if (error) {
        this.logger.error(`Erreur lors de l'enregistrement Eureka: ${error.message}`);
        const retryDelay = Math.min(30000, 5000 * 2 ** retryCount);
        setTimeout(() => this.registerWithRetry(retryCount + 1), retryDelay);
        return;
      }
      this.logger.log('Service enregistré avec succès dans Eureka');
    });
  }

  onModuleDestroy(): Promise<void> {
    return new Promise((resolve) => {
      this.client.stop(() => {
        this.logger.log("Service désenregistré d'Eureka");
        resolve();
      });
    });
  }
}