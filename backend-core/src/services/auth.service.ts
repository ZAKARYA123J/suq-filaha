import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config/env';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import 'dotenv/config';
import { UserType } from '@/generated/prisma';
import sendViaIAMAPI from "./sms.service"
import crypto from "crypto";
export class AuthService {
  // async register(data: RegisterInput) {
  //   const existingUser = await prisma.user.findUnique({
  //     where: { phoneNumber: data.phoneNumber },
  //   });

  //   if (existingUser) {
  //     throw new Error('already registered');
  //   }

  //   const hashedPassword = await argon2.hash(data.password);

  //   const user = await prisma.user.create({
  //     data: {
  //       ...data,
  //       password: hashedPassword,
  //     },
  //     select: {
  //       id: true,
  //       name: true,
  //       phoneNumber: true,
  //       userType: true,
  //       location: true,
  //       rating: true,
  //       registrationDate: true,
  //     },
  //   });

  //   const token = this.generateToken(user.id, data.userType);
   
  //   return { user, token };
  // }
async sendOtp(phoneNumber: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      throw new Error('Phone number already registered');
    }

const code = crypto.randomInt(100000, 1000000).toString();
    await prisma.phoneVerification.upsert({
      where: { phoneNumber },
      update: {
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verified: false,
      },
      create: {
        phoneNumber,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const smsResponse = await sendViaIAMAPI(phoneNumber, `Your code is ${code}`) as any;
    
    // Optional: Check SMS API response
    if (!smsResponse.success) {
      throw new Error('Failed to send OTP');
    }

    return { message: 'OTP sent' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
}

async verifyOtp(phoneNumber: string, code: string) {
  const verification = await prisma.phoneVerification.findUnique({
    where: { phoneNumber },
  });

  if (!verification) {
    throw new Error('OTP not found');
  }

  if (verification.code !== code) {
    throw new Error('Invalid OTP');
  }

  if (verification.expiresAt < new Date()) {
    throw new Error('OTP expired');
  }

  await prisma.phoneVerification.update({
    where: { phoneNumber },
    data: { verified: true },
  });

  return { message: 'Phone verified' };
}

async createPassword(data: {
  phoneNumber: string;
  password: string;
  name: string;
  userType: UserType;
}) {
  const verification = await prisma.phoneVerification.findUnique({
    where: { phoneNumber: data.phoneNumber },
  });

  if (!verification || !verification.verified) {
    throw new Error('Phone number not verified');
  }

  const hashedPassword = await argon2.hash(data.password);

  const user = await prisma.user.create({
    data: {
      phoneNumber: data.phoneNumber,
      password: hashedPassword,
      name: data.name,
      userType: data.userType,
    },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      userType: true,
      registrationDate: true,
    },
  });

  await prisma.phoneVerification.delete({
    where: { phoneNumber: data.phoneNumber },
  });

  const token = this.generateToken(user.id, user.userType);

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
  public generateToken(userId: string, userType: string): string {
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