import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const { username, password } = registerUserDto;
    const existingUser = await this.userModel.findOne({ username }).exec();
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } catch {
      throw new InternalServerErrorException('Error hashing password');
    }

    const newUser = new this.userModel({ username, password: hashedPassword });
    try {
      return await newUser.save();
    } catch {
      throw new InternalServerErrorException('Error creating user');
    }
  }
}
