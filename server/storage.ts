import { 
  users, type User, type InsertUser,
  type ChatbotConfig, type InsertChatbotConfig,
  type Category, type InsertCategory,
  type AIModel, type InsertAIModel,
  type ApiKey, type InsertApiKey,
  type ChatbotFile,
  chatbotFiles,
  chatbotConfigs,
  categories,
  aiModels,
  apiKeys,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // AI Model methods
  getAllAIModels(): Promise<AIModel[]>;
  getAIModel(id: number): Promise<AIModel | undefined>;
  createAIModel(model: InsertAIModel): Promise<AIModel>;

  // Chatbot methods
  getAllChatbots(): Promise<ChatbotConfig[]>;
  getChatbotConfig(id: number): Promise<ChatbotConfig | undefined>;
  createChatbot(config: InsertChatbotConfig): Promise<ChatbotConfig>;
  updateChatbot(id: number, config: Partial<ChatbotConfig>): Promise<ChatbotConfig>;
  deleteChatbot(id: number): Promise<void>;

  // API Key methods
  getAllApiKeys(): Promise<ApiKey[]>;
  getApiKeyByName(name: string): Promise<ApiKey | undefined>;
  createOrUpdateApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<void>;

  // Chatbot File methods
  getAllChatbotFiles(): Promise<ChatbotFile[]>;
  getChatbotFile(id: number): Promise<ChatbotFile | undefined>;
  createChatbotFile(file: Omit<ChatbotFile, "id" | "createdAt" | "updatedAt">): Promise<ChatbotFile>;
  deleteChatbotFile(id: number): Promise<void>;
  updateChatbotFile(id: number, file: Partial<ChatbotFile>): Promise<ChatbotFile>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      throw new Error("Category not found");
    }

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getAllAIModels(): Promise<AIModel[]> {
    return db.select().from(aiModels);
  }

  async getAIModel(id: number): Promise<AIModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return model;
  }

  async createAIModel(insertModel: InsertAIModel): Promise<AIModel> {
    const [model] = await db.insert(aiModels).values(insertModel).returning();
    return model;
  }

  async getAllChatbots(): Promise<ChatbotConfig[]> {
    return db.select().from(chatbotConfigs);
  }

  async getChatbotConfig(id: number): Promise<ChatbotConfig | undefined> {
    const [config] = await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.id, id));
    return config;
  }

  async createChatbot(insertConfig: InsertChatbotConfig): Promise<ChatbotConfig> {
    const [config] = await db.insert(chatbotConfigs).values(insertConfig).returning();
    return config;
  }

  async updateChatbot(id: number, updates: Partial<ChatbotConfig>): Promise<ChatbotConfig> {
    const [updated] = await db
      .update(chatbotConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatbotConfigs.id, id))
      .returning();

    if (!updated) {
      throw new Error("Chatbot not found");
    }

    return updated;
  }

  async deleteChatbot(id: number): Promise<void> {
    await db.delete(chatbotConfigs).where(eq(chatbotConfigs.id, id));
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return db.select().from(apiKeys);
  }

  async getApiKeyByName(name: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.name, name));
    return apiKey;
  }

  async createOrUpdateApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const existingKey = await this.getApiKeyByName(insertApiKey.name);

    if (existingKey) {
      // Update existing key
      const [updated] = await db
        .update(apiKeys)
        .set({
          provider: insertApiKey.provider,
          active: true,
          lastTested: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, existingKey.id))
        .returning();
      return updated;
    }

    // Create new key
    const [apiKey] = await db.insert(apiKeys)
      .values({
        ...insertApiKey,
        active: true,
        lastTested: new Date(),
      })
      .returning();
    return apiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async getAllChatbotFiles(): Promise<ChatbotFile[]> {
    return db.select().from(chatbotFiles);
  }

  async getChatbotFile(id: number): Promise<ChatbotFile | undefined> {
    const [file] = await db.select().from(chatbotFiles).where(eq(chatbotFiles.id, id));
    return file;
  }

  async createChatbotFile(file: Omit<ChatbotFile, "id" | "createdAt" | "updatedAt">): Promise<ChatbotFile> {
    const [created] = await db.insert(chatbotFiles).values(file).returning();
    return created;
  }

  async deleteChatbotFile(id: number): Promise<void> {
    await db.delete(chatbotFiles).where(eq(chatbotFiles.id, id));
  }

  async updateChatbotFile(id: number, updates: Partial<ChatbotFile>): Promise<ChatbotFile> {
    const [updated] = await db
      .update(chatbotFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatbotFiles.id, id))
      .returning();

    if (!updated) {
      throw new Error("File not found");
    }

    return updated;
  }
}

export const storage = new DatabaseStorage();