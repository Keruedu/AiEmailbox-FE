// Mock API for email dashboard
import { mockMailboxes, mockEmails, MockMailbox, MockEmail } from "./emailData";

// Simulate network delay
const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock authentication responses
export const mockAuth = {
  login: async (email: string, password: string) => {
    await delay(800);

    // Simple validation
    if (email && password.length >= 6) {
      return {
        accessToken: "mock-access-token-" + Date.now(),
        refreshToken: "mock-refresh-token-" + Date.now(),
        user: {
          id: "user-1",
          email,
          name: email.split("@")[0],
          picture: "",
          provider: "email",
        },
      };
    }

    throw new Error("Invalid credentials");
  },

  signup: async (email: string, password: string, name: string) => {
    await delay(800);

    return {
      accessToken: "mock-access-token-" + Date.now(),
      refreshToken: "mock-refresh-token-" + Date.now(),
      user: {
        id: "user-new",
        email,
        name,
        picture: "",
        provider: "email",
      },
    };
  },

  googleAuth: async () => {
    await delay(800);

    return {
      accessToken: "mock-access-token-google-" + Date.now(),
      refreshToken: "mock-refresh-token-google-" + Date.now(),
      user: {
        id: "user-google",
        email: "google.user@gmail.com",
        name: "Google User",
        picture: "",
        provider: "google",
      },
    };
  },

  refreshToken: async (refreshToken: string) => {
    await delay(300);

    if (refreshToken.startsWith("mock-refresh-token")) {
      return {
        accessToken: "mock-access-token-refreshed-" + Date.now(),
        refreshToken: "mock-refresh-token-refreshed-" + Date.now(),
      };
    }

    throw new Error("Invalid refresh token");
  },

  logout: async () => {
    await delay(200);
    return { message: "Logged out successfully" };
  },

  getMe: async () => {
    await delay(300);
    return {
      id: "user-1",
      email: "user@example.com",
      name: "Current User",
      picture: "",
      provider: "email",
    };
  },
};

// Mock email API
export const mockEmailApi = {
  getMailboxes: async (): Promise<{ mailboxes: MockMailbox[] }> => {
    await delay(400);
    return { mailboxes: mockMailboxes };
  },

  getEmails: async (
    mailboxId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<{
    emails: MockEmail[];
    total: number;
    page: number;
    perPage: number;
    hasNextPage: boolean;
  }> => {
    await delay(600);

    const filteredEmails = mockEmails.filter(
      (email) => email.mailboxId === mailboxId
    );
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedEmails = filteredEmails.slice(startIndex, endIndex);

    return {
      emails: paginatedEmails,
      total: filteredEmails.length,
      page,
      perPage,
      hasNextPage: endIndex < filteredEmails.length,
    };
  },

  getEmailById: async (emailId: string): Promise<MockEmail> => {
    await delay(400);

    const email = mockEmails.find((e) => e.id === emailId);
    if (!email) {
      throw new Error("Email not found");
    }

    return email;
  },

  markAsRead: async (emailId: string): Promise<void> => {
    await delay(300);
    const email = mockEmails.find((e) => e.id === emailId);
    if (email) {
      email.isRead = true;
    }
  },

  toggleStar: async (emailId: string): Promise<void> => {
    await delay(300);
    const email = mockEmails.find((e) => e.id === emailId);
    if (email) {
      email.isStarred = !email.isStarred;
    }
  },

  deleteEmail: async (emailId: string): Promise<void> => {
    await delay(400);
    const index = mockEmails.findIndex((e) => e.id === emailId);
    if (index > -1) {
      mockEmails.splice(index, 1);
    }
  },
};

// Export mock mode flag
export const USE_MOCK_API = false;
