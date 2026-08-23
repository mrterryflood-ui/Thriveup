import { db } from "../../storage";
import { chatConversations, chatMessages } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";

type Conversation = { id: number; ownerUserId: string | null; title: string; createdAt: Date };
type Message = { id: number; conversationId: number; role: string; content: string; createdAt: Date };

export interface IChatStorage {
  getConversation(id: number, ownerUserId: string): Promise<Conversation | undefined>;
  getAllConversations(ownerUserId: string): Promise<Conversation[]>;
  createConversation(title: string, ownerUserId: string): Promise<Conversation>;
  deleteConversation(id: number, ownerUserId: string): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id, ownerUserId) {
    const [row] = await db.select().from(chatConversations).where(and(
      eq(chatConversations.id, id),
      eq(chatConversations.ownerUserId, ownerUserId),
    ));
    return row;
  },
  async getAllConversations(ownerUserId) {
    return db.select().from(chatConversations)
      .where(eq(chatConversations.ownerUserId, ownerUserId))
      .orderBy(desc(chatConversations.createdAt));
  },
  async createConversation(title, ownerUserId) {
    const [row] = await db.insert(chatConversations).values({ title, ownerUserId }).returning();
    return row;
  },
  async deleteConversation(id, ownerUserId) {
    await db.delete(chatConversations).where(and(
      eq(chatConversations.id, id),
      eq(chatConversations.ownerUserId, ownerUserId),
    ));
  },
  async getMessagesByConversation(conversationId) {
    return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
  },
  async createMessage(conversationId, role, content) {
    const [row] = await db.insert(chatMessages).values({ conversationId, role, content }).returning();
    return row;
  },
};
