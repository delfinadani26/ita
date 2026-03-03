import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Para usar __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Garantir diretório existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Carregar dados
function loadSubmissions() {
  if (fs.existsSync(SUBMISSIONS_FILE)) {
    return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf-8"));
  }
  return [];
}

function saveSubmissions(data: any[]) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2));
}

function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  }
  return [];
}

function saveUsers(data: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

export const mockDb = {
  // Submissions
  getSubmissionsByUser: (userId: number) => {
    const subs = loadSubmissions();
    return subs.filter((s: any) => s.user_id === userId);
  },

  getAllSubmissions: () => {
    return loadSubmissions();
  },

  createSubmission: async (submission: any) => {
    const subs = loadSubmissions();
    const newSub = {
      id: (subs[subs.length - 1]?.id || 0) + 1,
      ...submission,
      created_at: new Date().toISOString(),
      status: "pending",
    };
    subs.push(newSub);
    saveSubmissions(subs);
    console.log(`✅ Mock submission saved: ID ${newSub.id}`);
    return newSub;
  },

  // Users
  getAllUsers: async () => {
    return loadUsers();
  },

  getUserByEmail: async (email: string) => {
    const users = loadUsers();
    return users.find((u: any) => u.email === email);
  },

  createUser: async (user: any) => {
    const users = loadUsers();
    const newUser = {
      id: (users[users.length - 1]?.id || 0) + 1,
      ...user,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    console.log(`✅ Mock user created: ${newUser.email}`);
    return newUser;
  },
};

export default mockDb;
