import { z } from "zod";

export type DebugLogger = ({
    error,
    message,
}: {
    error?: boolean;
    message: string;
}) => void;

export type Event<TInput = any, TOutput = any> = {
    handler: (input: TInput & { request: Request }) => Promise<TOutput>;
    schema?: z.ZodSchema<TInput>;
};

export type EventType<TInput = any, TOutput = any> = {
    input: TInput;
    output: TOutput;
};

export type EventCollection = Record<string, Event>;

export type LixnetServerInit<TEvents extends EventCollection> = {
    debugLog?: boolean;
    logger?: DebugLogger;
    jsonResponseMaker?: (data: any, init?: ResponseInit) => Response;
    events: TEvents;
};

export type ToEventTypes<TEvents extends EventCollection> = {
    [K in keyof TEvents]: TEvents[K] extends Event<infer TInput, infer TOutput>
        ? EventType<TInput, TOutput>
        : never;
};

// Client-specific types
export type ClientEventInput<T> = T extends {
    handler: (input: infer TInput) => any;
}
    ? Omit<TInput, "request">
    : never;

export type ClientEventOutput<T> = T extends {
    handler: (input: any) => Promise<infer TOutput>;
}
    ? TOutput
    : never;

export type ClientCaller<TEvents extends EventCollection> = <
    K extends keyof TEvents
>(
    event: K,
    input: ClientEventInput<TEvents[K]>
) => Promise<ClientEventOutput<TEvents[K]>>;
