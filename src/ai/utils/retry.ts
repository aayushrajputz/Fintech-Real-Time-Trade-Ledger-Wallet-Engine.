
export interface RetryOptions {
    maxRetries?: number;
    baseDelaysMs?: number;
    maxDelaysMs?: number;
}

export async function withExponentialBackOff<T>(ops: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelaysMs = options.baseDelaysMs ?? 150;
    const maxDelaysMs = options.maxDelaysMs ?? 1500;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await ops()
        } catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                console.log(`Max retries (${maxRetries}) exceed.`);
                break;
            }
            const exponentialDelay = baseDelaysMs * Math.pow(2, attempt);
            const cappedDelay = Math.min(maxDelaysMs, exponentialDelay)
            const jitter = Math.floor(Math.random() * cappedDelay * 0.5)
            const totalWaitTime = cappedDelay + jitter;

            console.warn(`Attempt ${attempt + 1}/${maxRetries} failed: "${lastError?.message || lastError}". Retrying in ${totalWaitTime}ms...`)
            await new Promise((resolve) => setTimeout(resolve, totalWaitTime))
        }
    }
    throw lastError;
} 