import fs from 'fs';
import path from 'path';
import { Database } from '../types';

const DB_PATH = process.env.DB_PATH || './src/data/database.json';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database if not exists
if (!fs.existsSync(DB_PATH)) {
  const initialDB: Database = {
    usuarios: [],
    campanas: [],
    tramites: [],
    botLogs: [],
    devices: [],
    botExecutions: [],
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
}

export class DatabaseManager {
  private dbPath: string;

  constructor(dbPath: string = DB_PATH) {
    this.dbPath = dbPath;
  }

  read(): Database {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      return {
        usuarios: [],
        campanas: [],
        tramites: [],
        botLogs: [],
        devices: [],
        botExecutions: [],
      };
    }
  }

  write(data: Database): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing database:', error);
      throw error;
    }
  }

  // Helper methods
  getUsuarios() {
    return this.read().usuarios;
  }

  getCampanas() {
    return this.read().campanas;
  }

  getTramites() {
    return this.read().tramites;
  }

  getBotLogs() {
    return this.read().botLogs;
  }

  getDevices() {
    return this.read().devices;
  }

  getBotExecutions() {
    return this.read().botExecutions;
  }

  // Update methods
  updateUsuarios(usuarios: any[]) {
    const db = this.read();
    db.usuarios = usuarios;
    this.write(db);
  }

  updateCampanas(campanas: any[]) {
    const db = this.read();
    db.campanas = campanas;
    this.write(db);
  }

  updateTramites(tramites: any[]) {
    const db = this.read();
    db.tramites = tramites;
    this.write(db);
  }

  updateBotLogs(botLogs: any[]) {
    const db = this.read();
    db.botLogs = botLogs;
    this.write(db);
  }

  updateDevices(devices: any[]) {
    const db = this.read();
    db.devices = devices;
    this.write(db);
  }

  updateBotExecutions(botExecutions: any[]) {
    const db = this.read();
    db.botExecutions = botExecutions;
    this.write(db);
  }
}

export const db = new DatabaseManager();
