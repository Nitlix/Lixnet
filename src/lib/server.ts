import { z } from "zod";
import LixnetLog from "./util/log";
import type {
    DebugLogger,
    Event,
    EventCollection,
    EventType,
    ToEventTypes,
    LixnetServerInit,
} from "./types";

export default class LixnetServer<TEvents extends EventCollection> {
    private eventCollection: TEvents;
    private logger: DebugLogger = LixnetLog;
    private debugLog: boolean = false;
    private jsonResponseMaker: (data: any, init?: ResponseInit) => Response;

    public constructor({
        debugLog = false,
        logger,
        jsonResponseMaker = Response.json,
        events,
    }: LixnetServerInit<TEvents>) {
        this.debugLog = debugLog;
        logger ? (this.logger = logger) : "";
        this.jsonResponseMaker = jsonResponseMaker;
        this.eventCollection = events;
    }

    public async handleRequest(request: Request) {
        let jsonData;
        try {
            jsonData = (await request.json()) as any;
        } catch (error) {
            this.debugLog
                ? this.logger({
                      error: true,
                      message: "Invalid JSON",
                  })
                : "";
            return this.jsonResponseMaker(
                {
                    error: "Invalid JSON",
                },
                { status: 400 }
            );
        }

        if (!jsonData.action) {
            return this.jsonResponseMaker(
                { error: "Action not found" },
                { status: 400 }
            );
        }

        if (!jsonData.input) {
            return this.jsonResponseMaker(
                { error: "Input not found" },
                { status: 400 }
            );
        }

        const event = this.eventCollection[jsonData.event];
        if (!event) {
            return this.jsonResponseMaker(
                {
                    error: "Action not found",
                },
                { status: 404 }
            );
        }

        try {
            const validatedInput = event.schema
                ? event.schema.parse(jsonData.input)
                : jsonData.input;

            const result = await event.handler(validatedInput);
            return this.jsonResponseMaker({ data: result });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.jsonResponseMaker(
                    {
                        error: "Invalid input",
                        details: (error as z.ZodError).issues,
                    },
                    { status: 400 }
                );
            }
            throw error;
        }
    }

    // Returns dummy functions that match the type signatures
    public getEventTypes(): ToEventTypes<TEvents> {
        const eventTypes = {} as ToEventTypes<TEvents>;

        Object.entries(this.eventCollection).forEach(([key, event]) => {
            // Create a dummy function that matches the type signature
            (eventTypes as any)[key] = {
                input: (() => {}) as any, // Dummy function for input type
                output: (() => {}) as any, // Dummy function for output type
            };
        });

        return eventTypes;
    }

    // Keep this for internal use only
    public getEventCollection(): TEvents {
        return this.eventCollection;
    }
}
