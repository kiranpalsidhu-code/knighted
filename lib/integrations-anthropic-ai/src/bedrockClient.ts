import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

type MessageParam = {
  role: string;
  content: string | Array<unknown>;
};

type CreateParams = {
  model: string;
  max_tokens: number;
  system?: string;
  messages: MessageParam[];
  [key: string]: unknown;
};

type StreamEvent = {
  type: string;
  delta?: { type: string; text?: string };
  [key: string]: unknown;
};

type MessagesLike = {
  create(params: CreateParams): Promise<unknown>;
  stream(params: CreateParams): AsyncIterable<StreamEvent>;
};

export type BedrockClientLike = {
  messages: MessagesLike;
};

export function createBedrockClient(config: {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}): BedrockClientLike {
  const client = new BedrockRuntimeClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    messages: {
      async create(params: CreateParams): Promise<unknown> {
        const { model, ...rest } = params;
        const requestBody = JSON.stringify({
          ...rest,
          anthropic_version: "bedrock-2023-05-31",
        });

        const command = new InvokeModelCommand({
          modelId: model,
          contentType: "application/json",
          accept: "application/json",
          body: new TextEncoder().encode(requestBody),
        });

        const response = await client.send(command);
        const decoded = new TextDecoder().decode(response.body);
        return JSON.parse(decoded);
      },

      stream(params: CreateParams): AsyncIterable<StreamEvent> {
        const { model, ...rest } = params;
        const requestBody = JSON.stringify({
          ...rest,
          anthropic_version: "bedrock-2023-05-31",
        });

        return {
          [Symbol.asyncIterator]: async function* () {
            const command = new InvokeModelWithResponseStreamCommand({
              modelId: model,
              contentType: "application/json",
              accept: "application/json",
              body: new TextEncoder().encode(requestBody),
            });

            const response = await client.send(command);
            if (!response.body) return;

            for await (const event of response.body) {
              if (event.chunk?.bytes) {
                const decoded = new TextDecoder().decode(event.chunk.bytes);
                const parsed = JSON.parse(decoded) as StreamEvent;
                yield parsed;
              }
            }
          },
        };
      },
    },
  };
}
