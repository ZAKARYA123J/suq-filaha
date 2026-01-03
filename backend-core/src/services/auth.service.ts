import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config/env';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import 'dotenv/config';


export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingUser) {
      throw new Error('already registered');
    }

    const hashedPassword = await argon2.hash(data.password);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        userType: true,
        location: true,
        rating: true,
        registrationDate: true,
      },
    });

    const token = this.generateToken(user.id, data.userType);
   
    return { user, token };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const validPassword = await argon2.verify(user.password, data.password);

    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.userType);
     const chatToken=this.chatToken(user.id, user.userType,user.name,data.phoneNumber)
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token,chatToken };
  }  
   
  private chatToken(userId:string,userType:string,phoneNumber:string,name:string):string{
   const payloud={userId,userType,phoneNumber,name}
   return jwt.sign(payloud,config.jwtSecret,{algorithm:"HS256"})
  }
  private generateToken(userId: string, userType: string): string {
     const payloud={userId,userType}
    return jwt.sign(
      payloud,
      config.jwtSecret,
      {algorithm:"HS256",expiresIn: config.jwtExpiration }
    );
  }

  async getUserProfile(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        location: true,
        userType: true,
        rating: true,
        profileInfo: true,
        registrationDate: true,
      },
    });
  }

  async updateProfile(userId: string, data: Partial<RegisterInput>) {
    if (data.password) {
      data.password = await argon2.hash(data.password);
    }

    return await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        location: true,
        userType: true,
        rating: true,
        profileInfo: true,
      },
    });
  }

  async getUser(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        location: true,
        userType: true,
        rating: true,
        profileInfo: true,
      },
    });
  }
}