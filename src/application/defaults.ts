import type { ClockPort, IdGeneratorPort, RandomPort, SoundPort } from "./ports";

export class SystemClock implements ClockPort {
  now(): number {
    return Date.now();
  }

  setTimer(callback: () => void, delayMs: number): unknown {
    return window.setTimeout(callback, delayMs);
  }

  clearTimer(timer: unknown): void {
    window.clearTimeout(timer as number);
  }
}

export class BrowserIdGenerator implements IdGeneratorPort {
  next(prefix: string): string {
    return `${prefix}-${crypto.randomUUID()}`;
  }
}

export class SeededRandom implements RandomPort {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }
}

export function hashSeed(value: string): number {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export const silentSound: SoundPort = {
  play() {}
};

