import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { User, UserSchema } from './schemas/user.schema';
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/chat-app'),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
  ],
})
export class AppModule {}
