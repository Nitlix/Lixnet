import type {
    EventCollection,
    ClientEventInput,
    ClientEventOutput,
    ClientCaller,
} from "./types";

export default class LixnetClient<TEvents extends EventCollection> {
    private rpcUrl: string;
    private events: TEvents;

    public constructor({
        events,
        rpcUrl,
    }: {
        events: TEvents;
        rpcUrl: string;
    }) {
        this.rpcUrl = rpcUrl;
        this.events = events;
    }

    public call: ClientCaller<TEvents> = async (event, input) => {
        const response = await fetch(this.rpcUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ event, input }),
        });

        const json = await response.json();

        if (json.error) {
            throw new Error(json.error);
        }

        return json.data;
    };

    // Keep this for internal use only
    public getEventCollection(): TEvents {
        return this.events;
    }
}
