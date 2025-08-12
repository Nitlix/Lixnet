import { z } from "zod";
import LixnetLog from "./util/log";
import type {
    DebugLogger,
    FunctionInput,
    LXNServerHandler,
    LXN_ServerClient_EventType,
} from "./types";

type LXNServerEventInput<
    Events extends LXN_ServerClient_EventType,
    TName extends keyof Events
> = {
    name: TName;
    handler: LXNServerHandler<
        FunctionInput<Events[TName]> & { request: Request }
    >;
    schema?: z.ZodSchema<any>;
};

export default class LixnetServer<Events extends LXN_ServerClient_EventType> {
    private events: Record<string, LXNServerEventInput<Events, keyof Events>> =
        {};
    private logger: DebugLogger = LixnetLog;
    private debugLog: boolean = false;
    private jsonResponseMaker: (data: any, init?: ResponseInit) => Response;

    public constructor({
        debugLog = false,
        logger,
        jsonResponseMaker = Response.json,
    }: {
        debugLog?: boolean;
        logger?: DebugLogger;
        jsonResponseMaker?: (data: any, init?: ResponseInit) => Response;
    }) {
        this.debugLog = debugLog;
        logger ? (this.logger = logger) : "";
        this.jsonResponseMaker = jsonResponseMaker;
    }

    public on<K extends keyof Events & string>(
        input: LXNServerEventInput<Events, K> | LXNServerEventInput<Events, K>[]
    ) {
        if (Array.isArray(input)) {
            input.forEach((event) => {
                this.events[event.name] = event;
            });
        } else {
            this.events[input.name] = input;
        }
    }

    public async handle(request: Request) {
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

        if (!jsonData.event) {
            return this.jsonResponseMaker(
                { error: "Event not found" },
                { status: 400 }
            );
        }

        if (!jsonData.input) {
            return this.jsonResponseMaker(
                { error: "Input not found" },
                { status: 400 }
            );
        }

        const event = this.events[jsonData.event];
        if (!event) {
            return this.jsonResponseMaker(
                {
                    error: "Event not found",
                },
                { status: 404 }
            );
        }

        try {
            const validatedInput = event.schema
                ? event.schema.parse(jsonData.input)
                : jsonData.input;

            try {
                const result = await event.handler({
                    request,
                    ...validatedInput,
                });
                return this.jsonResponseMaker({ data: result });
            } catch (error) {
                return this.jsonResponseMaker(
                    {
                        error: "Handler error",
                        details: error,
                    },
                    { status: 500 }
                );
            }
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
}
