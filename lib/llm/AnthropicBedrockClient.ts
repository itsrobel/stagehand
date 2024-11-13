import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { LLMClient, ChatCompletionOptions } from "./LLMClient";
import { zodToJsonSchema } from "zod-to-json-schema";
import { LLMCache } from "../cache/LLMCache";

export class AnthropicBedrockClient implements LLMClient {
  private client: BedrockRuntimeClient;
  private cache: LLMCache;
  public logger: (message: {
    category?: string;
    message: string;
    level?: number;
  }) => void;
  private enableCaching: boolean;
  private requestId: string;

  constructor(
    logger: (message: {
      category?: string;
      message: string;
      level?: number;
    }) => void,
    enableCaching = false,
    cache: LLMCache,
    requestId: string,
  ) {
    this.client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
    this.logger = logger;
    this.cache = cache;
    this.enableCaching = enableCaching;
    this.requestId = requestId;
  }

  async createChatCompletion(
    options: ChatCompletionOptions & { retries?: number },
  ) {
    // Cache handling
    const cacheOptions = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      image: options.image,
      response_model: options.response_model,
      tools: options.tools,
      retries: options.retries,
    };

    if (this.enableCaching) {
      const cachedResponse = await this.cache.get(cacheOptions, this.requestId);
      if (cachedResponse) {
        this.logger({
          category: "llm_cache",
          message: "LLM Cache hit - returning cached response",
          level: 1,
        });
        return cachedResponse;
      }
      this.logger({
        category: "llm_cache",
        message: "LLM Cache miss - no cached response found",
        level: 1,
      });
    }

    // Message preparation
    const systemMessage = options.messages.find((msg) => msg.role === "system");
    const userMessages = options.messages.filter(
      (msg) => msg.role !== "system",
    );

    // Handle image if present
    if (options.image) {
      const screenshotMessage: any = {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: options.image.buffer.toString("base64"),
            },
          },
          ...(options.image.description
            ? [{ type: "text", text: options.image.description }]
            : []),
        ],
      };
      options.messages = [...options.messages, screenshotMessage];
    }

    // Transform tools
    let anthropicTools = options.tools?.map((tool: any) => {
      if (tool.type === "function") {
        return {
          name: tool.function.name,
          description: tool.function.description,
          input_schema: {
            type: "object",
            properties: tool.function.parameters.properties,
            required: tool.function.parameters.required,
          },
        };
      }
      return tool;
    });

    // Handle response model
    let toolDefinition;
    if (options.response_model) {
      const jsonSchema = zodToJsonSchema(options.response_model.schema);
      const schemaProperties =
        jsonSchema.definitions?.MySchema?.properties || jsonSchema.properties;
      const schemaRequired =
        jsonSchema.definitions?.MySchema?.required || jsonSchema.required;

      toolDefinition = {
        name: "print_extracted_data",
        description: "Prints the extracted data based on the provided schema.",
        input_schema: {
          type: "object",
          properties: schemaProperties,
          required: schemaRequired,
        },
      };
    }

    if (toolDefinition) {
      anthropicTools = anthropicTools ?? [];
      anthropicTools.push(toolDefinition);
    }

    // Prepare Bedrock request
    const request = {
      modelId: options.model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: options.max_tokens || 1500,
        messages: userMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        tools: anthropicTools,
        system: systemMessage?.content,
        temperature: options.temperature,
      }),
    };

    try {
      const command = new InvokeModelCommand(request);
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Transform response to match expected format
      const transformedResponse = {
        id: responseBody.id,
        object: "chat.completion",
        created: Date.now(),
        model: options.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                responseBody.content.find((c: any) => c.type === "text")
                  ?.text || null,
              tool_calls: responseBody.content
                .filter((c: any) => c.type === "tool_use")
                .map((toolUse: any) => ({
                  id: toolUse.id,
                  type: "function",
                  function: {
                    name: toolUse.name,
                    arguments: JSON.stringify(toolUse.input),
                  },
                })),
            },
            finish_reason: responseBody.stop_reason,
          },
        ],
        usage: {
          prompt_tokens: responseBody.usage.input_tokens,
          completion_tokens: responseBody.usage.output_tokens,
          total_tokens:
            responseBody.usage.input_tokens + responseBody.usage.output_tokens,
        },
      };

      this.logger({
        category: "Anthropic Bedrock",
        message: "Transformed response: " + JSON.stringify(transformedResponse),
      });

      if (options.response_model) {
        const toolUse = responseBody.content.find(
          (c: any) => c.type === "tool_use",
        );
        if (toolUse && "input" in toolUse) {
          const result = toolUse.input;
          if (this.enableCaching) {
            this.cache.set(cacheOptions, result, this.requestId);
          }
          return result;
        } else if (!options.retries || options.retries < 5) {
          return this.createChatCompletion({
            ...options,
            retries: (options.retries ?? 0) + 1,
          });
        }
        throw new Error(
          "Create Chat Completion Failed: No tool use with input in response",
        );
      }

      if (this.enableCaching) {
        this.cache.set(cacheOptions, transformedResponse, this.requestId);
      }

      return transformedResponse;
    } catch (error) {
      this.logger({
        category: "Anthropic Bedrock",
        message: `Error: ${error}`,
        level: 3,
      });
      throw error;
    }
  }
}
