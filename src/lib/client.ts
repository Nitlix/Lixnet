import type { EventCollection, CallableEvent } from "./types";

export default class LixnetClientConstructor<TEvents extends EventCollection> {
    private baseUrl: string;
    private events: TEvents;

    public constructor({
        events,
        baseUrl,
    }: {
        events: TEvents;
        baseUrl: string;
    }) {
        this.baseUrl = baseUrl;
        this.events = events;
    }

    public getClient(): {
        [K in keyof TEvents]: TEvents[K] extends {
            handler: (input: infer TInput) => Promise<infer TOutput>;
        }
            ? CallableEvent<Omit<TInput, "request">, TOutput>
            : never;
    } {
        const client = {} as any;

        Object.keys(this.events).forEach((key) => {
            client[key] = async (input: any) => {
                const response = await fetch(this.baseUrl, {
                    method: "POST",
                    body: JSON.stringify({ event: key, input }),
                });
                try {
                    const json = (await response.json()) as any;
                    if (json.error) {
                        throw new Error(json.error);
                    }
                    return json.data;
                } catch (error) {
                    console.error(error);
                    return null;
                }
            };
        });

        return client;
    }
}
