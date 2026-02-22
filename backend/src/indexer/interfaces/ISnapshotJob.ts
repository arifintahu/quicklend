export interface ISnapshotJob {
    start(): void;
    stop(): void;
    takeSnapshot(): Promise<void>;
}
