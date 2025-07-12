// IPTV Backend: NestJS with Auth, VoD, Settings, Stripe-ready (MariaDB/MySQL)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { VodModule } from './vod/vod.module';
import { SettingsModule } from './settings/settings.module';
import { User } from './auth/user.entity';
import { Vod } from './vod/vod.entity';
import { Settings } from './settings/settings.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'iptv_platform',
      entities: [User, Vod, Settings],
      synchronize: true
    }),
    AuthModule,
    VodModule,
    SettingsModule
  ]
})
export class AppModule {}

// auth/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'user' })
  role: 'guest' | 'user' | 'admin';

  @Column('json', { nullable: true })
  subscription?: {
    status: string;
    expiresAt: string;
  };
}

// vod/vod.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Vod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  folder: string;

  @Column()
  date: string;

  @Column({ default: 'subscribers' })
  visibleTo: 'subscribers' | 'all';
}

// settings/settings.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  liveStreamUrl: string;

  @Column()
  vodBaseUrl: string;

  @Column('json')
  schedule: Record<string, string>; // e.g. { weekday: "08:00-18:00" }
}

// auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}

// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { user };
  }
}

// vod/vod.controller.ts
import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { VodService } from './vod.service';

@Controller('api/vod')
export class VodController {
  constructor(private readonly vodService: VodService) {}

  @Get()
  getVodList() {
    return this.vodService.getAll();
  }

  @Post()
  uploadVod(@Body() body: any) {
    return this.vodService.create(body);
  }

  @Delete(':folder')
  deleteVod(@Param('folder') folder: string) {
    return this.vodService.remove(folder);
  }
}

// vod/vod.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vod } from './vod.entity';

@Injectable()
export class VodService {
  constructor(
    @InjectRepository(Vod)
    private vodRepo: Repository<Vod>
  ) {}

  getAll() {
    return this.vodRepo.find();
  }

  create(data: Partial<Vod>) {
    const vod = this.vodRepo.create(data);
    return this.vodRepo.save(vod);
  }

  remove(folder: string) {
    return this.vodRepo.delete({ folder });
  }
}

// settings/settings.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  getSettings() {
    return this.service.get();
  }

  @Post()
  updateSettings(@Body() body: any) {
    return this.service.update(body);
  }
}

// settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepo: Repository<Settings>
  ) {}

  async get() {
    return this.settingsRepo.findOneBy({ id: 1 });
  }

  async update(data: Partial<Settings>) {
    let settings = await this.get();
    if (!settings) settings = this.settingsRepo.create();
    Object.assign(settings, data);
    return this.settingsRepo.save(settings);
  }
}
