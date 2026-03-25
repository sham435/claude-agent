import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import { VersionsModule } from './versions/versions.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), VersionsModule],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
