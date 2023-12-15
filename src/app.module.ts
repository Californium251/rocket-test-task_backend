import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AmocrmModule } from './amocrm/amocrm.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AmocrmModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
