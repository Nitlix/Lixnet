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
export type EventTypeCollection = Record<string, EventType>;

export type LixnetServerInit<TEvents extends EventCollection> = {
    debugLog?: boolean;
    logger?: DebugLogger;
    jsonResponseMaker?: (data: any, init?: ResponseInit) => Response;
    events: TEvents;
};

export type LixnetClientInit<TEventTypes extends EventTypeCollection> = {
    eventTypes: TEventTypes;
    baseUrl: string;
};

export type CallableEvent<TInput = any, TOutput = any> = (
    input: TInput
) => Promise<TOutput>;

export type ToEventTypes<TEvents extends EventCollection> = {
    [K in keyof TEvents]: TEvents[K] extends Event<infer TInput, infer TOutput>
        ? EventType<TInput, TOutput>
        : never;
};

export type ClientEvents<TEventTypes extends EventTypeCollection> = {
    [K in keyof TEventTypes]: TEventTypes[K] extends EventType<
        infer TInput,
        infer TOutput
    >
        ? CallableEvent<TInput, TOutput>
        : never;
};
