import { pgTable, text, serial, json, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const userRoles = ["user", "admin"] as const;
export const userRoleEnum = z.enum(userRoles);
export type UserRole = z.infer<typeof userRoleEnum>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user").$type<UserRole>(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Models table
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // e.g., 'openai', 'anthropic', 'google', 'deepseek'
  modelId: text("model_id").notNull(), // e.g., 'gpt-4', 'claude-2', etc.
  apiKeyName: text("api_key_name").notNull(), // Environment variable name for the API key
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chatbot Configurations table
export const chatbotConfigs = pgTable("chatbot_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  modelId: integer("model_id").references(() => aiModels.id),
  systemPrompt: text("system_prompt").notNull().default("Be precise and concise."),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Files table for chatbot configuration
export const chatbotFiles = pgTable("chatbot_files", {
  id: serial("id").primaryKey(),
  chatbotId: integer("chatbot_id").references(() => chatbotConfigs.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileContent: text("file_content").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys Configuration table
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Environment variable name
  provider: text("provider").notNull(), // e.g., 'openai', 'anthropic', etc.
  active: boolean("active").default(true),
  lastTested: timestamp("last_tested"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  role: true,
});

export const insertCategorySchema = createInsertSchema(categories);
export const insertAIModelSchema = createInsertSchema(aiModels);
export const insertChatbotConfigSchema = createInsertSchema(chatbotConfigs);
export const insertApiKeySchema = createInsertSchema(apiKeys).extend({
  value: z.string(), // For handling the API key value in requests
});

// New insert schema for files that will be used server-side
export const insertChatbotFileSchema = createInsertSchema(chatbotFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type AIModel = typeof aiModels.$inferSelect;
export type InsertAIModel = z.infer<typeof insertAIModelSchema>;

export type ChatbotConfig = typeof chatbotConfigs.$inferSelect;
export type InsertChatbotConfig = z.infer<typeof insertChatbotConfigSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// File-related types
export type ChatbotFile = typeof chatbotFiles.$inferSelect;
export type InsertChatbotFile = z.infer<typeof insertChatbotFileSchema>;

// Form validation schemas
export const contactForm = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

// Schema for file upload in the browser
export const chatbotFileUploadSchema = z.object({
  chatbotId: z.number().optional(),
  files: z.array(z.instanceof(File))
});

export type ContactFormData = z.infer<typeof contactForm>;
export type ChatbotFileUpload = z.infer<typeof chatbotFileUploadSchema>;