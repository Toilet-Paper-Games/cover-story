import type { ClockPort, IdGeneratorPort } from "../application/ports";
import { SeededRandom } from "../application/defaults";

interface ScheduledTimer {
  id: number;
  at: number;
  callback: () => void;
}

export class FakeClock implements ClockPort {
  private currentTime: number;
  private nextTimerId = 1;
  private readonly timers = new Map<number, ScheduledTimer>();

  constructor(startAt = 1_700_000_000_000) {
    this.currentTime = startAt;
  }

  now(): number {
    return this.currentTime;
  }

  setTimer(callback: () => void, delayMs: number): unknown {
    const timer = { id: this.nextTimerId++, at: this.currentTime + delayMs, callback };
    this.timers.set(timer.id, timer);
    return timer.id;
  }

  clearTimer(timer: unknown): void {
    this.timers.delete(Number(timer));
  }

  advanceBy(milliseconds: number): void {
    const target = this.currentTime + milliseconds;
    while (true) {
      const next = [...this.timers.values()]
        .filter((timer) => timer.at <= target)
        .sort((left, right) => left.at - right.at || left.id - right.id)[0];
      if (!next) break;
      this.currentTime = next.at;
      this.timers.delete(next.id);
      next.callback();
    }
    this.currentTime = target;
  }
}

export class PredictableIdGenerator implements IdGeneratorPort {
  private count = 0;
  next(prefix: string): string {
    this.count += 1;
    return `${prefix}-${String(this.count).padStart(3, "0")}`;
  }
}

export function seededRandom(seed = 42) {
  return new SeededRandom(seed);
}
