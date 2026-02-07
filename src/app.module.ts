import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validate } from './env.validation';
import { ContentModule } from './modules/content/content.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { GameCoreModule } from './modules/game-core/game-core.module';
import { GameplayModule } from './modules/gameplay/gameplay.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    ContentModule,
    UsersModule,
    AuthModule,
    GameCoreModule,
    GameplayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
