import fs from 'fs';
import path from 'path';
import { IFileRecord } from '../models/file.model';

const DB_PATH = path.resolve(process.cwd(), 'public/uploads/file_database.json');

export class FileDatabase {
  private static records: Map<string, IFileRecord> = new Map();

  public static initialize(): void {
    try {
      if (fs.existsSync(DB_PATH)) {
        const rawData = fs.readFileSync(DB_PATH, 'utf-8');
        const list: IFileRecord[] = JSON.parse(rawData);
        this.records.clear();
        for (const item of list) {
          this.records.set(item.id, item);
        }
      }
    } catch (error) {
      console.warn('Could not read existing file_database.json, initializing empty db.');
    }
  }

  private static persist(): void {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = JSON.stringify(Array.from(this.records.values()), null, 2);
      fs.writeFileSync(DB_PATH, data, 'utf-8');
    } catch (err) {
      console.error('Failed to persist file_database.json', err);
    }
  }

  public static save(record: IFileRecord): IFileRecord {
    this.records.set(record.id, record);
    this.persist();
    return record;
  }

  public static findById(id: string): IFileRecord | undefined {
    return this.records.get(id);
  }

  public static findByFilename(filename: string): IFileRecord | undefined {
    for (const record of this.records.values()) {
      if (record.filename === filename) {
        return record;
      }
    }
    return undefined;
  }

  public static findAll(): IFileRecord[] {
    return Array.from(this.records.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public static deleteById(id: string): boolean {
    const existed = this.records.delete(id);
    if (existed) {
      this.persist();
    }
    return existed;
  }
}
