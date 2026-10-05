export type BackgroundTaskLogger = (message: string, error: unknown) => void;

const defaultLogger: BackgroundTaskLogger = (message, error) => {
  console.error(message, error);
};

/**
 * Run fire-and-forget work without leaking a rejected promise into the process.
 * Failures remain visible through the supplied logger (or stderr by default).
 */
export async function runBackgroundTaskSafely<T>(
  label: string,
  task: () => T | PromiseLike<T>,
  logger: BackgroundTaskLogger = defaultLogger,
): Promise<T | undefined> {
  try {
    return await task();
  } catch (error) {
    logger(`[BackgroundTask] ${label} failed:`, error);
    return undefined;
  }
}
