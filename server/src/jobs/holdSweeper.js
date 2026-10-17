import { releaseExpiredHolds } from '../services/bookingService.js';

export function startHoldSweeper(intervalMs = 60000) {
  const timer = setInterval(() => {
    releaseExpiredHolds().catch((err) => console.error('Hold sweeper failed:', err.message));
  }, intervalMs);
  timer.unref();
  return timer;
}
