import type { Log } from 'viem';

export interface DecodedEvent {
    eventName: string;
    args: Record<string, unknown>;
    log: Log;
}

export interface IEventProcessor {
    process(event: DecodedEvent): Promise<void>;
}
