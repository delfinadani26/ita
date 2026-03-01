import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface User {
  id: number;
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
  created_at: string;
}

export interface Submission {
  id: number;
  user_id: number;
  title: string;
  abstract?: string;
  keywords?: string;
  file_uri?: string;
  file_name?: string;
  thematic_axis: number;
  status: "pending" | "approved" | "rejected";
  reviewer_id?: number;
  review_note?: string;
  submitted_at: string;
  reviewed_at?: string;
  user_name?: string;
  user_email?: string;
  reviewer_name?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  submission_id?: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

export const db = {
  async createUser(data: Omit<User, "id" | "created_at" | "is_checked_in">): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password, academic_degree, category, affiliation, institution, role, qr_code, payment_status, payment_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [data.full_name, data.email, data.password, data.academic_degree, data.category, data.affiliation, data.institution, data.role, data.qr_code, data.payment_status, data.payment_amount]
    );
    return result.rows[0];
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
  },

  async getUserById(id: number): Promise<User | null> {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  async getAllUsers(): Promise<User[]> {
    const result = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    return result.rows;
  },

  async updateUser(id: number, data: Partial<User>): Promise<User | null> {
    const fields = Object.keys(data).filter(k => k !== "id" && k !== "created_at");
    if (fields.length === 0) return null;
    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map(f => (data as any)[f]);
    const result = await pool.query(
      `UPDATE users SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  },

  async getUserStats(): Promise<Record<string, number>> {
    const result = await pool.query(`
      SELECT category, affiliation, COUNT(*) as count
      FROM users WHERE role = 'participant'
      GROUP BY category, affiliation
    `);
    const stats: Record<string, number> = {};
    for (const row of result.rows) {
      stats[`${row.category}_${row.affiliation}`] = parseInt(row.count);
    }
    return stats;
  },

  async createSubmission(data: Pick<Submission, "user_id" | "title" | "abstract" | "keywords" | "file_uri" | "file_name" | "thematic_axis">): Promise<Submission> {
    const result = await pool.query(
      `INSERT INTO submissions (user_id, title, abstract, keywords, file_uri, file_name, thematic_axis)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.user_id, data.title, data.abstract, data.keywords, data.file_uri, data.file_name, data.thematic_axis]
    );
    return result.rows[0];
  },

  async getSubmissionsByUser(userId: number): Promise<Submission[]> {
    const result = await pool.query(
      `SELECT s.*, u.full_name as user_name, u.email as user_email
       FROM submissions s JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1 ORDER BY s.submitted_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getAllSubmissions(): Promise<Submission[]> {
    const result = await pool.query(
      `SELECT s.*, u.full_name as user_name, u.email as user_email,
       r.full_name as reviewer_name
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users r ON s.reviewer_id = r.id
       ORDER BY s.submitted_at DESC`
    );
    return result.rows;
  },

  async getSubmissionById(id: number): Promise<Submission | null> {
    const result = await pool.query(
      `SELECT s.*, u.full_name as user_name, u.email as user_email,
       r.full_name as reviewer_name
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users r ON s.reviewer_id = r.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async reviewSubmission(id: number, reviewerId: number, status: "approved" | "rejected", note?: string): Promise<Submission | null> {
    const result = await pool.query(
      `UPDATE submissions SET status = $1, reviewer_id = $2, review_note = $3, reviewed_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, reviewerId, note, id]
    );
    return result.rows[0] || null;
  },

  async createMessage(data: Pick<Message, "sender_id" | "recipient_id" | "content" | "submission_id">): Promise<Message> {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, submission_id, content)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.sender_id, data.recipient_id, data.submission_id, data.content]
    );
    return result.rows[0];
  },

  async getMessages(userId: number, otherUserId: number): Promise<Message[]> {
    const result = await pool.query(
      `SELECT m.*, s.full_name as sender_name, r.full_name as recipient_name
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.recipient_id = r.id
       WHERE (m.sender_id = $1 AND m.recipient_id = $2)
          OR (m.sender_id = $2 AND m.recipient_id = $1)
       ORDER BY m.created_at ASC`,
      [userId, otherUserId]
    );
    return result.rows;
  },

  async getMessageThreads(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         other_user_id,
         u.full_name as other_name,
         u.email as other_email,
         u.role as other_role,
         last_message,
         last_at,
         (SELECT COUNT(*) FROM messages WHERE recipient_id = $1 AND sender_id = other_user_id AND is_read = FALSE) as unread_count
       FROM (
         SELECT DISTINCT ON (CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END)
           CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END as other_user_id,
           m.content as last_message,
           m.created_at as last_at
         FROM messages m
         WHERE m.sender_id = $1 OR m.recipient_id = $1
         ORDER BY CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END, m.created_at DESC
       ) sub
       JOIN users u ON u.id = sub.other_user_id
       ORDER BY last_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async markMessagesRead(senderId: number, recipientId: number): Promise<void> {
    await pool.query(
      "UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND recipient_id = $2",
      [senderId, recipientId]
    );
  },

  async getFinancialStats(): Promise<any> {
    const result = await pool.query(`
      SELECT
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN payment_amount ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN payment_status = 'approved' THEN 1 END) as approved_not_paid,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count
      FROM users WHERE role = 'participant'
    `);
    const subResult = await pool.query(`
      SELECT
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM submissions
    `);
    return { ...result.rows[0], ...subResult.rows[0] };
  },

  async getUserByQrCode(qrCode: string): Promise<User | null> {
    const result = await pool.query("SELECT * FROM users WHERE qr_code = $1", [qrCode]);
    return result.rows[0] || null;
  },

  async checkInUser(id: number): Promise<User | null> {
    const result = await pool.query(
      "UPDATE users SET is_checked_in = TRUE WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0] || null;
  },
};
