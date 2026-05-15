import { db } from "../../storage";
import { chatConversations, chatMessages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

type Conversation = { id: number; title: string; createdAt: Date };
type Message = { id: number; conversationId: number; role: string; content: string; createdAt: Date };

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id) {
    const [row] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    return row;
  },
  async getAllConversations() {
    return db.select().from(chatConversations).orderBy(desc(chatConversations.createdAt));
  },
  async createConversation(title) {
    const [row] = await db.insert(chatConversations).values({ title }).returning();
    return row;
  },
  async deleteConversation(id) {
    await db.delete(chatConversations).where(eq(chatConversations.id, id));
  },
  async getMessagesByConversation(conversationId) {
    return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
  },
  async createMessage(conversationId, role, content) {
    const [row] = await db.insert(chatMessages).values({ conversationId, role, content }).returning();
    return row;
  },
};
