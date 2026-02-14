import fs from 'fs';//
import path from 'path';//

import Database from 'better-sqlite3';

import { watchQueue } from './watch.js';

const db = new Database('data.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS defaults (
    scopeId TEXT,
    mode TEXT,
    game TEXT,
    PRIMARY KEY (scopeId, mode)
  );
  CREATE TABLE IF NOT EXISTS watchers (
    channelId TEXT PRIMARY KEY,
    mode TEXT,
    game TEXT,
    role TEXT,
    everyone INTEGER,
    countThreshold INTEGER,
    delay INTEGER
  );
`);

export const defaults = new Map();
const DEFAULTS_FILE = path.resolve('./defaults.json');//

export const watchers = new Map();
const WATCHERS_FILE = path.resolve('./watchers.json');//

export function readWatcherFile() {//
  if (!fs.existsSync(WATCHERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(WATCHERS_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to parse watchers file:', err);
    return [];
  }
}

export function addWatcher(channelId, mode, game, role, everyone, countThreshold, delay) {
  db.prepare(`
    INSERT OR REPLACE INTO watchers (channelId, mode, game, role, everyone, countThreshold, delay)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(channelId, mode, game, role, everyone ? 1 : 0, countThreshold, delay);
}

export function removeWatcher(channelId) {
  db.prepare('DELETE FROM watchers WHERE channelId = ?').run(channelId);
}

export async function loadWatchers(client) {
  const saved = readWatcherFile();

  for (const watcher of saved) {
    try {
      const channel = await client.channels.fetch(watcher.channelId);
      watchers.set(watcher.channelId, { game: watcher.game, interval: watchQueue(channel, watcher.mode, watcher.game, watcher.role, watcher.everyone, watcher.countThreshold, watcher.delay) });
      addWatcher(watcher.channelId, watcher.mode, watcher.game, watcher.role, watcher.everyone, watcher.countThreshold, watcher.delay);
    } catch (err) {
      console.error(`Failed to restore watcher for ${watcher.channelId}`, err);
    }
  }
}

export function readDefaultsFile() {//
  if (!fs.existsSync(DEFAULTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to parse defaults file:', err);
    return [];
  }
}

export function addDefault(scopeId, mode, game) {
  db.prepare(`
    INSERT OR REPLACE INTO defaults (scopeId, mode, game)
    VALUES (?, ?, ?)
  `).run(scopeId, mode, game);
}

export function removeDefault(scopeId, mode) {
  db.prepare('DELETE FROM defaults WHERE scopeId = ? AND mode = ?').run(scopeId, mode);
}

export async function loadDefaults() {
  const saved = readDefaultsFile();

  for (const entry of saved) {
    try {
      defaults.set(entry.scopeId, new Map(Object.entries(entry.modes)));
      for (const [mode, game] of Object.entries(entry.modes))
        addDefault(entry.scopeId, mode, game);
      
    } catch (err) {
      console.error(`Failed to restore default for ${entry.scopeId}`, err);
    }
  }
}