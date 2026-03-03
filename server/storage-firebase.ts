/**
 * Firebase Firestore Storage Layer
 * Implementa a mesma interface do storage.ts original mas com Firestore
 */

import { db, firebaseConnected } from "./firebase-config";
import { mockDb } from "./mock-db";

// Tipos (mesmos do storage.ts original)
export interface User {
  id?: string;
  full_name: string;
  email: string;
  password: string;
  academic_degree?: string;
  category: "docente" | "estudante" | "outro" | "preletor";
  affiliation: "urnm" | "externo";
  institution?: string;
  role: "participant" | "avaliador" | "admin";
  qr_code?: string;
  payment_status: "pending" | "approved" | "paid" | "exempt";
  payment_amount?: number;
  is_checked_in: boolean;
  created_at?: string;
}

export interface Submission {
  id?: string;
  user_id: string;
  title: string;
  abstract?: string;
  keywords?: string;
  file_uri?: string;
  file_name?: string;
  thematic_axis: number;
  status: "pending" | "approved" | "rejected";
  reviewer_id?: string;
  review_note?: string;
  submitted_at?: string;
  reviewed_at?: string;
  user_name?: string;
  user_email?: string;
  reviewer_name?: string;
}

export interface Message {
  id?: string;
  sender_id: string;
  recipient_id: string;
  submission_id?: string;
  content: string;
  is_read: boolean;
  created_at?: string;
}

export interface CongressProgram {
  id?: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  is_completed: boolean;
  created_at?: string;
}

export const firebaseDb = {
  // ============================================
  // USERS COLLECTION
  // ============================================
  async getUserById(id: string): Promise<User | null> {
    if (!firebaseConnected || !db) return mockDb.getUserByEmail("") as any;
    try {
      const doc = await db.collection("users").doc(id).get();
      return doc.exists ? { ...doc.data(), id: doc.id } as User : null;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return mockDb.getUserByEmail("") as any;
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (!firebaseConnected || !db) return mockDb.getUserByEmail(email) as any;
    try {
      const query = await db.collection("users").where("email", "==", email).limit(1).get();
      if (query.empty) return null;
      const doc = query.docs[0];
      return { ...doc.data(), id: doc.id } as User;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return mockDb.getUserByEmail(email) as any;
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (!firebaseConnected || !db) return mockDb.getAllUsers() as any;
    try {
      const query = await db.collection("users").orderBy("created_at", "asc").get();
      return query.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return mockDb.getAllUsers() as any;
    }
  },

  async createUser(user: User): Promise<User> {
    if (!firebaseConnected || !db) return mockDb.createUser(user) as any;
    try {
      const userData = {
        ...user,
        created_at: new Date().toISOString(),
      };
      const docRef = await db.collection("users").add(userData);
      return { ...userData, id: docRef.id } as User;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return mockDb.createUser(user) as any;
    }
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    if (!firebaseConnected || !db) return null;
    try {
      await db.collection("users").doc(id).update(data);
      return this.getUserById(id);
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return null;
    }
  },

  // ============================================
  // SUBMISSIONS COLLECTION
  // ============================================
  async createSubmission(data: Omit<Submission, "id" | "created_at">): Promise<Submission> {
    if (!firebaseConnected || !db) return mockDb.createSubmission(data) as any;
    try {
      const submissionData = {
        ...data,
        created_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
      };
      const docRef = await db.collection("submissions").add(submissionData);
      return { ...submissionData, id: docRef.id } as Submission;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return mockDb.createSubmission(data) as any;
    }
  },

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    if (!firebaseConnected || !db) return mockDb.getSubmissionsByUser(parseInt(userId)) as any;
    try {
      const query = await db.collection("submissions")
        .where("user_id", "==", userId)
        .orderBy("submitted_at", "desc")
        .get();
      
      const submissions = await Promise.all(
        query.docs.map(async doc => {
          const data = doc.data();
          const user = await this.getUserById(data.user_id);
          return {
            ...data,
            id: doc.id,
            user_name: user?.full_name,
            user_email: user?.email,
          } as Submission;
        })
      );
      return submissions;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return mockDb.getSubmissionsByUser(parseInt(userId)) as any;
    }
  },

  async getAllSubmissions(): Promise<Submission[]> {
    if (!firebaseConnected || !db) return [];
    try {
      const query = await db.collection("submissions").orderBy("submitted_at", "desc").get();
      
      const submissions = await Promise.all(
        query.docs.map(async doc => {
          const data = doc.data();
          const user = await this.getUserById(data.user_id);
          const reviewer = data.reviewer_id ? await this.getUserById(data.reviewer_id) : null;
          return {
            ...data,
            id: doc.id,
            user_name: user?.full_name,
            user_email: user?.email,
            reviewer_name: reviewer?.full_name,
          } as Submission;
        })
      );
      return submissions;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return [];
    }
  },

  // ============================================
  // STATS & QUERIES
  // ============================================
  async getUserStats(): Promise<Record<string, number>> {
    if (!firebaseConnected || !db) return {};
    try {
      const query = await db.collection("users").where("role", "==", "participant").get();
      const stats: Record<string, number> = {};
      
      // Initialize all keys with 0
      const categories = ["docente", "estudante", "outro", "preletor"];
      const affiliations = ["urnm", "externo"];
      for (const cat of categories) {
        for (const aff of affiliations) {
          stats[`${cat}_${aff}`] = 0;
        }
      }

      // Count occurrences
      query.docs.forEach(doc => {
        const user = doc.data() as User;
        const key = `${user.category}_${user.affiliation}`;
        stats[key] = (stats[key] || 0) + 1;
      });

      return stats;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return {};
    }
  },

  async getTotalParticipants(): Promise<number> {
    if (!firebaseConnected || !db) return 0;
    try {
      const query = await db.collection("users").where("role", "==", "participant").get();
      return query.size;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return 0;
    }
  },

  // ============================================
  // MESSAGES COLLECTION
  // ============================================
  async createMessage(message: Omit<Message, "id" | "created_at">): Promise<Message> {
    if (!firebaseConnected || !db) return { ...message, created_at: new Date().toISOString(), id: "temp" };
    try {
      const messageData = {
        ...message,
        created_at: new Date().toISOString(),
      };
      const docRef = await db.collection("messages").add(messageData);
      return { ...messageData, id: docRef.id } as Message;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return { ...message, created_at: new Date().toISOString(), id: "temp" };
    }
  },

  // ============================================
  // CONGRESS PROGRAM COLLECTION
  // ============================================
  async getCongressProgram(): Promise<CongressProgram[]> {
    if (!firebaseConnected || !db) return [];
    try {
      const query = await db.collection("congress_program").orderBy("date", "asc").get();
      return query.docs.map(doc => ({ ...doc.data(), id: doc.id } as CongressProgram));
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return [];
    }
  },

  // Métodos adicionais faltando
  async getSubmissionById(id: string): Promise<Submission | null> {
    if (!firebaseConnected || !db) return null;
    try {
      const doc = await db.collection("submissions").doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data();
      if (!data) return null;
      const user = await this.getUserById(data.user_id);
      const reviewer = data.reviewer_id ? await this.getUserById(data.reviewer_id) : null;
      return {
        ...data,
        id: doc.id,
        user_name: user?.full_name,
        user_email: user?.email,
        reviewer_name: reviewer?.full_name,
      } as Submission;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return null;
    }
  },

  async reviewSubmission(submissionId: string, reviewerId: string, status: "approved" | "rejected", note: string): Promise<Submission | null> {
    if (!firebaseConnected || !db) return null;
    try {
      await db.collection("submissions").doc(submissionId).update({
        status,
        reviewer_id: reviewerId,
        review_note: note,
        reviewed_at: new Date().toISOString(),
      });
      return this.getSubmissionById(submissionId);
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return null;
    }
  },

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    if (!firebaseConnected || !db) return [];
    try {
      const query = await db.collection("messages")
        .where("sender_id", "in", [userId1, userId2])
        .where("recipient_id", "in", [userId1, userId2])
        .orderBy("created_at", "asc")
        .get();
      return query.docs.map(doc => ({ ...doc.data(), id: doc.id } as Message));
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return [];
    }
  },

  async markMessagesRead(senderId: string, recipientId: string): Promise<void> {
    if (!firebaseConnected || !db) return;
    try {
      const query = await db.collection("messages")
        .where("sender_id", "==", senderId)
        .where("recipient_id", "==", recipientId)
        .where("is_read", "==", false)
        .get();
      
      const batch = db.batch();
      query.docs.forEach(doc => {
        batch.update(doc.ref, { is_read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("❌ Firebase error:", err);
    }
  },

  async getMessageThreads(userId: string): Promise<any[]> {
    if (!firebaseConnected || !db) return [];
    try {
      const messages = await db.collection("messages")
        .where("sender_id", "in", [userId])
        .orderBy("created_at", "desc")
        .limit(100)
        .get();
      
      const threadsMap: Record<string, any> = {};
      for (const doc of messages.docs) {
        const msg = doc.data();
        const otherUserId = msg.recipient_id === userId ? msg.sender_id : msg.recipient_id;
        if (!threadsMap[otherUserId]) {
          const user = await this.getUserById(otherUserId);
          threadsMap[otherUserId] = {
            userId: otherUserId,
            userName: user?.full_name,
            userEmail: user?.email,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
          };
        }
      }
      return Object.values(threadsMap);
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return [];
    }
  },

  async getUserByQrCode(qrCode: string): Promise<User | null> {
    if (!firebaseConnected || !db) return null;
    try {
      const query = await db.collection("users").where("qr_code", "==", qrCode).limit(1).get();
      if (query.empty) return null;
      const doc = query.docs[0];
      return { ...doc.data(), id: doc.id } as User;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return null;
    }
  },

  async checkInUser(userId: string): Promise<User | null> {
    if (!firebaseConnected || !db) return null;
    try {
      await db.collection("users").doc(userId).update({
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
      });
      return this.getUserById(userId);
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return null;
    }
  },

  async getParticipants(page: number = 1, limit: number = 10, status?: string): Promise<any> {
    if (!firebaseConnected || !db) return { users: [], pagination: { page, limit, total: 0 } };
    try {
      let query = db.collection("users").where("role", "==", "participant");
      
      if (status && status !== "all") {
        query = query.where("payment_status", "==", status);
      }
      
      const total = (await query.get()).size;
      const offset = (page - 1) * limit;
      
      const docs = await query.orderBy("created_at", "desc").offset(offset).limit(limit).get();
      const users = docs.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      
      return {
        users,
        pagination: { page, limit, total },
      };
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return { users: [], pagination: { page, limit, total: 0 } };
    }
  },

  async getProgram(): Promise<CongressProgram[]> {
    return this.getCongressProgram();
  },

  async toggleProgramItem(itemId: string): Promise<CongressProgram | null> {
    if (!firebaseConnected || !db) return null;
    try {
      const doc = await db.collection("congress_program").doc(itemId).get();
      if (!doc.exists) return null;
      const item = doc.data();
      if (!item) return null;
      await db.collection("congress_program").doc(itemId).update({
        is_completed: !item.is_completed,
      });
      return { ...item, id: doc.id, is_completed: !item.is_completed } as CongressProgram;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return null;
    }
  },

  async getParticipantStats(): Promise<any> {
    if (!firebaseConnected || !db) return {};
    try {
      const users = await this.getAllUsers();
      const participants = users.filter(u => u.role === "participant" && (u.payment_status === "paid" || u.payment_status === "approved"));
      
      const stats = {
        total: participants.length,
        by_category: {
          docente: 0,
          estudante: 0,
          outro: 0,
          preletor: 0,
        },
        by_status: {
          checked_in: participants.filter(u => u.is_checked_in).length,
          approved: participants.filter(u => u.payment_status === "approved").length,
          paid: participants.filter(u => u.payment_status === "paid").length,
        }
      };

      participants.forEach(u => {
        if (u.category in stats.by_category) {
          stats.by_category[u.category as keyof typeof stats.by_category]++;
        }
      });

      return stats;
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return {};
    }
  },

  async getFinancialStats(): Promise<any> {
    if (!firebaseConnected || !db) return {};
    try {
      const users = await this.getAllUsers();
      return {
        checked_in_count: users.filter(u => u.is_checked_in).length,
        pending_count: users.filter(u => u.payment_status === "pending").length,
        approved_count: users.filter(u => u.payment_status === "approved").length,
        paid_count: users.filter(u => u.payment_status === "paid").length,
        total_participants: users.filter(u => u.role === "participant").length,
      };
    } catch (err) {
      console.error("❌ Firebase error:", err);
      return {};
    }
  },
};

export default firebaseDb;
