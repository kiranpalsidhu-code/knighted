import Anthropic from "@anthropic-ai/sdk";
import { createBedrockClient } from "./bedrockClient.js";

const bedrockRegion = process.env.AWS_BEDROCK_REGION;
const bedrockAccessKey = process.env.AWS_BEDROCK_ACCESS_KEY_ID;
const bedrockSecretKey = process.env.AWS_BEDROCK_SECRET_ACCESS_KEY;
const USE_BEDROCK = !!(bedrockRegion && bedrockAccessKey && bedrockSecretKey);

/**
 * Active model name to use in messages.create / messages.stream calls.
 *
 * When AWS Bedrock credentials are present (USE_BEDROCK=true) this resolves to
 * a Bedrock model ID (default: Claude 3.5 Sonnet v2, confirmed available in
 * ca-central-1). Override with the BEDROCK_MODEL_ID env var to use a newer
 * model once it becomes available in your Bedrock region.
 *
 * Without Bedrock credentials this resolves to the direct Anthropic API model
 * name (override with the ANTHROPIC_MODEL env var).
 */
export const MODEL_SONNET: string = USE_BEDROCK
  ? (process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-5-sonnet-20241022-v2:0")
  : (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6");

let anthropicClient: Anthropic;

if (USE_BEDROCK) {
  // eslint-disable-next-line no-console
  console.info(
    `[anthropic] Using AWS Bedrock in ${bedrockRegion} — model: ${MODEL_SONNET}`,
  );
  anthropicClient = createBedrockClient({
    region: bedrockRegion!,
    accessKeyId: bedrockAccessKey!,
    secretAccessKey: bedrockSecretKey!,
  }) as unknown as Anthropic;
} else {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY must be set (or provide AWS_BEDROCK_* credentials to use Bedrock).",
    );
  }
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    // Optional: point at a compatible proxy/gateway; defaults to the Anthropic API.
    ...(process.env.ANTHROPIC_BASE_URL
      ? { baseURL: process.env.ANTHROPIC_BASE_URL }
      : {}),
  });
}

export const anthropic = anthropicClient;
