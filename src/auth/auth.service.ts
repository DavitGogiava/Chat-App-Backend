import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string; data?: { access_token: string } }> {
    const { username, email, password } = registerUserDto;
    console.log(email);
    const existingUser = await this.userModel.findOne({ username }).exec();
    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const existingEmail = await this.userModel.findOne({ email }).exec();
    if (existingEmail) {
      throw new HttpException(
        'Email is already registered',
        HttpStatus.BAD_REQUEST,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    const payload = { username: newUser.username, sub: newUser._id };
    const token = this.jwtService.sign(payload);

    return {
      message: 'User registered and logged in successfully',
      data: { access_token: token },
    };
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ message: string; data?: { access_token: string } }> {
    const { username, password } = loginUserDto;

    const user = await this.validateUser(username, password);
    if (!user) {
      throw new HttpException(
        { message: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = { username: user.username, sub: user._id };
    const token = this.jwtService.sign(payload);

    return {
      message: 'User logged in successfully',
      data: {
        access_token: token,
      },
    };
  }

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }
    return { username: user.username };
  }

  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    if (updateUserDto.username) {
      user.username = updateUserDto.username;
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    return user.save();
  }
}
