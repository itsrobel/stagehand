import { OpenAIClient } from "./OpenAIClient";
import { AnthropicClient } from "./AnthropicClient";
import { AnthropicBedrockClient } from "./AnthropicBedrockClient";
import { LLMClient } from "./LLMClient";
import { LLMCache } from "../cache/LLMCache";

export type AvailableModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4o-2024-08-06"
  | "claude-3-5-sonnet-latest"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-sonnet-20240620"
  | "anthropic.claude-3-sonnet-20240229-v1:0"
  | "anthropic.claude-3-haiku-20240307-v1:0"
  | "anthropic.claude-3-opus-20240229-v1:0";

export class LLMProvider {
  modelToProviderMap: { [key in AvailableModel]: string } = {
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
    "gpt-4o-2024-08-06": "openai",
    "claude-3-5-sonnet-latest": "anthropic",
    "claude-3-5-sonnet-20240620": "anthropic",
    "claude-3-5-sonnet-20241022": "anthropic",
    "anthropic.claude-3-sonnet-20240229-v1:0": "anthropic-bedrock",
    "anthropic.claude-3-haiku-20240307-v1:0": "anthropic-bedrock",
    "anthropic.claude-3-opus-20240229-v1:0": "anthropic-bedrock",
  };

  private logger: (message: { category?: string; message: string }) => void;
  private enableCaching: boolean;
  private cache: LLMCache;

  constructor(
    logger: (message: { category?: string; message: string }) => void,
    enableCaching: boolean,
  ) {
    this.logger = logger;
    this.enableCaching = enableCaching;
    this.cache = new LLMCache(logger);
  }

  cleanRequestCache(requestId: string): void {
    this.logger({
      category: "llm_cache",
      message: `Cleaning up cache for requestId: ${requestId}`,
    });
    this.cache.deleteCacheForRequestId(requestId);
  }

  getClient(modelName: AvailableModel, requestId: string): LLMClient {
    const provider = this.modelToProviderMap[modelName];
    if (!provider) {
      throw new Error(`Unsupported model: ${modelName}`);
    }

    switch (provider) {
      case "openai":
        return new OpenAIClient(
          this.logger,
          this.enableCaching,
          this.cache,
          requestId,
        );

      case "anthropic":
        return new AnthropicClient(
          this.logger,
          this.enableCaching,
          this.cache,
          requestId,
        );

      case "anthropic-bedrock":
        return new AnthropicBedrockClient(
          this.logger,
          this.enableCaching,
          this.cache,
          requestId,
        );

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
