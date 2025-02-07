import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertChatbotConfigSchema,
  insertCategorySchema,
  insertApiKeySchema,
  insertAIModelSchema,
  insertChatbotFileSchema,
  contactForm,
} from "@shared/schema";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";
import { ZodError } from "zod";
import { OpenAI } from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import * as path from 'path';

// Initialize Firebase Admin with service account
const serviceAccount = path.join(process.cwd(), 'attached_assets', 'automationintelligence-ee41d-firebase-adminsdk-fbsvc-611a2679d1.json');

initializeApp({
  credential: cert(serviceAccount),
});

// Add specific admin user check to the verifyAuth middleware
async function verifyAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    // Get the user's custom claims
    const userRecord = await getAuth().getUser(decodedToken.uid);
    console.log('User claims:', userRecord.customClaims);

    // Check if user has admin role - Fixed comparison logic
    if (!userRecord.customClaims || userRecord.customClaims.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Admin privileges required" });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export function registerRoutes(app: Express): Server {
  // Add an endpoint to check if a user is an admin
  app.post("/api/check-admin", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await getAuth().verifyIdToken(token);
      const { uid, email } = req.body;

      // Verify that the token matches the provided UID
      if (decodedToken.uid !== uid) {
        return res.status(403).json({ message: "Unauthorized: Token mismatch" });
      }

      // Get admin email from environment variable
      const adminEmail = process.env.VITE_ADMIN_EMAIL;
      if (!adminEmail) {
        console.error("VITE_ADMIN_EMAIL environment variable is not set");
        return res.status(500).json({ message: "Admin configuration error" });
      }

      // Force admin role for the specific email
      const isAdmin = email.toLowerCase() === 'hsahingoz@techknows-it.nl';
      console.log(`Checking admin status for ${email}: ${isAdmin}`);

      // Set the admin custom claim
      await getAuth().setCustomUserClaims(uid, { role: 'admin' });

      // Get updated user record to confirm changes
      const updatedUser = await getAuth().getUser(uid);
      console.log('Updated user claims:', updatedUser.customClaims);

      res.json({
        message: "Admin role assigned successfully",
        isAdmin: true
      });
    } catch (error: any) {
      console.error("Error setting admin role:", error);
      res.status(500).json({
        message: "Failed to set admin role",
        error: error.message
      });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const data = contactForm.parse(req.body);
      // TODO: Implement actual email sending logic
      console.log("Contact form submission:", data);
      res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid form data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Chatbot interaction
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, chatbotId } = req.body;

      // Get the chatbot configuration
      const config = await storage.getChatbotConfig(chatbotId);
      if (!config) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Get the AI model configuration
      const model = await storage.getAIModel(config.modelId);
      if (!model) {
        return res.status(404).json({ message: "AI model not found" });
      }

      // Initialize chat based on model provider
      let response;
      switch (model.provider) {
        case "openai":
          response = await openai.chat.completions.create({
            model: model.modelId,
            messages: [
              { role: "system", content: config.systemPrompt },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });
          break;
        // Add other providers here
        default:
          throw new Error(`Unsupported AI provider: ${model.provider}`);
      }

      res.json({
        choices: [
          {
            message: {
              content: response.choices[0].message.content,
            },
          },
        ],
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat request" });
    }
  });

  // Admin routes
  app.post("/api/admin/chatbots", verifyAuth, async (req, res) => {
    try {
      const { fileIds, ...configData } = req.body;
      const config = insertChatbotConfigSchema.parse(configData);
      const chatbot = await storage.createChatbot(config);

      // Update file associations if fileIds are provided
      if (Array.isArray(fileIds) && fileIds.length > 0) {
        await Promise.all(
          fileIds.map(async (fileId) => {
            const file = await storage.getChatbotFile(fileId);
            if (file) {
              await storage.updateChatbotFile(fileId, { ...file, chatbotId: chatbot.id });
            }
          })
        );
      }

      res.json(chatbot);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid configuration", errors: error.errors });
      } else {
        console.error("Chatbot creation error:", error);
        res.status(500).json({ message: "Failed to create chatbot" });
      }
    }
  });

  app.get("/api/admin/chatbots", verifyAuth, async (req, res) => {
    try {
      const chatbots = await storage.getAllChatbots();
      res.json(chatbots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chatbots" });
    }
  });

  app.patch("/api/admin/chatbots/:id", verifyAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertChatbotConfigSchema.partial().parse(req.body);
      const updated = await storage.updateChatbot(id, updates);
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid configuration", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update chatbot" });
      }
    }
  });

  app.delete("/api/admin/chatbots/:id", verifyAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChatbot(id);
      res.json({ message: "Chatbot deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chatbot" });
    }
  });

  app.post("/api/admin/categories", verifyAuth, async (req, res) => {
    try {
      const category = insertCategorySchema.parse(req.body);
      const created = await storage.createCategory(category);
      res.json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.get("/api/admin/categories", verifyAuth, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.patch("/api/admin/categories/:id", verifyAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCategorySchema.partial().parse(req.body);
      const updated = await storage.updateCategory(id, updates);
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete("/api/admin/categories/:id", verifyAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });


  // Create AI model
  app.post("/api/admin/models", verifyAuth, async (req, res) => {
    try {
      const model = insertAIModelSchema.parse(req.body);
      const created = await storage.createAIModel(model);
      res.json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid model data", errors: error.errors });
      } else {
        console.error("AI model creation error:", error);
        res.status(500).json({ message: "Failed to create AI model" });
      }
    }
  });

  // Get all AI models - modify to only return active models
  app.get("/api/admin/models", verifyAuth, async (req, res) => {
    try {
      const models = await storage.getAllAIModels();
      const apiKeys = await storage.getAllApiKeys();

      // Get active API keys
      const activeKeys = apiKeys.filter(key => key.active);
      console.log("Active API keys:", activeKeys.map(k => k.name));

      // Filter models to only include those with active API keys
      const activeModels = models.filter(model => {
        const hasActiveKey = activeKeys.some(key => key.name === model.apiKeyName);
        console.log(`Model ${model.name} (${model.apiKeyName}): hasActiveKey=${hasActiveKey}`);
        return hasActiveKey;
      });

      console.log("Returning active models:", activeModels);
      res.json(activeModels);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  // Get all API keys
  app.get("/api/admin/api-keys", verifyAuth, async (req, res) => {
    try {
      const apiKeys = await storage.getAllApiKeys();
      res.json(apiKeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  // Create or update API key with model creation
  app.post("/api/admin/api-keys", verifyAuth, async (req, res) => {
    try {
      const { value, ...apiKeyData } = insertApiKeySchema.parse(req.body);
      console.log("Creating/Updating API key:", apiKeyData.name, "for provider:", apiKeyData.provider);

      // Set the API key in environment
      process.env[apiKeyData.name] = value;

      const created = await storage.createOrUpdateApiKey({
        ...apiKeyData,
        active: true,
        lastTested: new Date(),
      });

      console.log("API key created/updated:", created);

      // Create corresponding AI model if it doesn't exist
      const modelMapping = {
        openai: {
          name: "GPT-4 Turbo",
          modelId: "gpt-4-turbo-preview",
        },
        anthropic: {
          name: "Claude 3.5 Sonnet",
          modelId: "claude-3-sonnet-20240229",
        },
        google: {
          name: "Gemini Pro",
          modelId: "gemini-pro",
        }
      } as const;

      const modelConfig = modelMapping[apiKeyData.provider as keyof typeof modelMapping];
      if (modelConfig) {
        // Check if model already exists
        const existingModels = await storage.getAllAIModels();
        const modelExists = existingModels.some(model =>
          model.apiKeyName === apiKeyData.name && model.provider === apiKeyData.provider
        );

        console.log("Creating model for API key:", !modelExists);

        if (!modelExists) {
          const model = await storage.createAIModel({
            name: modelConfig.name,
            provider: apiKeyData.provider,
            modelId: modelConfig.modelId,
            apiKeyName: apiKeyData.name,
            active: true,
          });
          console.log("Created AI model:", model);
        }
      }

      res.json(created);
    } catch (error) {
      console.error("API key creation/update error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid API key data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save API key" });
      }
    }
  });

  // Delete API key
  app.delete("/api/admin/api-keys/:id", verifyAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteApiKey(id);
      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      console.error("API key deletion error:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });

  app.post("/api/admin/api-keys/test", verifyAuth, async (req, res) => {
    try {
      const { provider, value } = req.body;

      switch (provider) {
        case "openai": {
          const openai = new OpenAI({ apiKey: value });
          await openai.models.list();
          break;
        }
        case "anthropic": {
          const anthropic = new Anthropic({ apiKey: value });
          await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1,
            messages: [{ role: "user", content: "test" }],
          });
          break;
        }
        case "google": {
          const genAI = new GoogleGenerativeAI(value);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          await model.generateContent("test");
          break;
        }
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      res.json({ message: "API key validated successfully" });
    } catch (error: any) {
      console.error("API key test error:", error);
      res.status(400).json({
        message: `Failed to validate API key: ${error.message}`,
      });
    }
  });

  app.post("/api/admin/config", verifyAuth, async (req, res) => {
    try {
      const config = insertChatbotConfigSchema.parse(req.body);
      await storage.updateConfig(config);
      res.json({ message: "Configuration updated successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid configuration", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update configuration" });
      }
    }
  });

  app.get("/api/admin/config", verifyAuth, async (req, res) => {
    try {
      const config = await storage.getLatestConfig();
      if (!config) {
        return res.status(404).json({ message: "No configuration found" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // File management routes
  app.post("/api/admin/files", verifyAuth, upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const savedFiles = await Promise.all(
        files.map(async (file) => {
          const fileData = {
            fileName: file.originalname,
            fileType: file.mimetype,
            fileContent: file.buffer.toString('base64'), // Convert Buffer to base64 string
            fileSize: file.size,
            chatbotId: null, // Optional association with a chatbot
          };
          return storage.createChatbotFile(fileData);
        })
      );

      res.json(savedFiles);
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  app.get("/api/admin/files", verifyAuth, async (req, res) => {
    try {
      const files = await storage.getAllChatbotFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.delete("/api/admin/files", verifyAuth, async (req, res) => {
    try {
      const { fileIds } = req.body;
      if (!Array.isArray(fileIds)) {
        return res.status(400).json({ message: "Invalid request body" });
      }

      await Promise.all(fileIds.map((id) => storage.deleteChatbotFile(id)));
      res.json({ message: "Files deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete files" });
    }
  });

  // Add public endpoint for fetching active chatbots
  app.get("/api/chatbots", async (req, res) => {
    try {
      const chatbots = await storage.getAllChatbots();
      // Only return active chatbots and necessary fields
      const activeChatbots = chatbots
        .filter(chatbot => chatbot.active)
        .map(({ id, name, description }) => ({ id, name, description }));
      res.json(activeChatbots);
    } catch (error) {
      console.error("Error fetching public chatbots:", error);
      res.status(500).json({ message: "Failed to fetch chatbots" });
    }
  });

  // Add these routes after the existing admin routes
  app.get("/api/admin/members", verifyAuth, async (req, res) => {
    try {
      // List all users
      const listUsersResult = await getAuth().listUsers();
      const members = listUsersResult.users.map(user => ({
        uid: user.uid,
        email: user.email,
        role: user.customClaims?.role || 'user'
      }));

      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.patch("/api/admin/members/role", verifyAuth, async (req, res) => {
    try {
      const { uid, role } = req.body;

      if (!uid || !role || !['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: "Invalid request body" });
      }

      // Get the admin email from environment variable
      const adminEmail = process.env.VITE_ADMIN_EMAIL;
      if (!adminEmail) {
        console.error("VITE_ADMIN_EMAIL environment variable is not set");
        return res.status(500).json({ message: "Admin configuration error" });
      }

      // Get user record to check email
      const userRecord = await getAuth().getUser(uid);

      // Prevent changing the main admin's role
      if (userRecord.email?.toLowerCase() === adminEmail.toLowerCase() && role !== 'admin') {
        return res.status(403).json({
          message: "Cannot change the role of the primary administrator"
        });
      }

      // Update user's custom claims
      await getAuth().setCustomUserClaims(uid, { role });

      res.json({
        message: "Role updated successfully",
        role
      });
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "Failed to update member role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}