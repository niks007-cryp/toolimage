export class RequestTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestTimeoutError";
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => reject(new RequestTimeoutError(message)), timeoutMs);
    void promise.then(
      (value) => { globalThis.clearTimeout(timer); resolve(value); },
      (error) => { globalThis.clearTimeout(timer); reject(error); },
    );
  });
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number, message: string): Promise<Response> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new RequestTimeoutError(message);
    throw error;
  } finally {
    globalThis.clearTimeout(timer);
  }
}
