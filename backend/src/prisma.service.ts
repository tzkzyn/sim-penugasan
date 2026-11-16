import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PrismaService implements OnModuleInit {
  private client: any;
  private inMemoryTasks: any[] = [];
  private readonly storageFile = path.resolve(__dirname, '../../tasks_storage.json');

  constructor() {
    this.loadStorage();
    try {
      this.client = new PrismaClient();
    } catch {
      console.warn('[Prisma] Database MySQL belum aktif/dikonfigurasi. Backend berjalan dalam mode standalone dengan JSON persistence.');
    }
  }

  private loadStorage() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf-8');
        this.inMemoryTasks = JSON.parse(data);
      }
    } catch {
      this.inMemoryTasks = [];
    }
  }

  private saveStorage() {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.inMemoryTasks, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Prisma] Gagal menyimpan ke storage:', e);
    }
  }

  async onModuleInit() {
    try {
      if (this.client) {
        await this.client.$connect();
      }
    } catch {
      console.warn('[Prisma] Menggunakan in-memory storage untuk sinkronisasi realtime.');
    }
  }

  get suratTugas() {
    if (this.client?.suratTugas) {
      return this.client.suratTugas;
    }

    return {
      findMany: async () => {
        this.loadStorage();
        return [...this.inMemoryTasks];
      },
      findUnique: async (args: { where: { id: string } }) => {
        this.loadStorage();
        return this.inMemoryTasks.find((t) => t.id === args.where.id) || null;
      },
      create: async (args: { data: any }) => {
        this.loadStorage();
        const newTask = {
          id: args.data.id || 'st-' + Date.now(),
          createdAt: new Date().toISOString(),
          status: args.data.status || 'DRAFT',
          ...args.data,
        };
        this.inMemoryTasks.unshift(newTask);
        this.saveStorage();
        return newTask;
      },
      update: async (args: { where: { id: string }; data: any }) => {
        this.loadStorage();
        const index = this.inMemoryTasks.findIndex((t) => t.id === args.where.id);
        if (index !== -1) {
          this.inMemoryTasks[index] = {
            ...this.inMemoryTasks[index],
            ...args.data,
            updatedAt: new Date().toISOString(),
          };
          this.saveStorage();
          return this.inMemoryTasks[index];
        }
        return null;
      },
      delete: async (args: { where: { id: string } }) => {
        this.loadStorage();
        const index = this.inMemoryTasks.findIndex((t) => t.id === args.where.id);
        if (index !== -1) {
          const removed = this.inMemoryTasks.splice(index, 1)[0];
          this.saveStorage();
          return removed;
        }
        return null;
      },
    };
  }
}
