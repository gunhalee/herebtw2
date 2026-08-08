export const ABUSE_POLICY = {
  postCreate: {
    deviceBudgets: [
      { limit: 1, windowSeconds: 15 },
      { limit: 10, windowSeconds: 60 * 60 },
      { limit: 20, windowSeconds: 24 * 60 * 60 },
    ],
    networkBudgets: [
      { limit: 10, windowSeconds: 10 * 60 },
      { limit: 60, windowSeconds: 60 * 60 },
    ],
  },
  agreeToggle: {
    deviceBudgets: [{ limit: 30, windowSeconds: 5 * 60 }],
    networkBudgets: [{ limit: 150, windowSeconds: 10 * 60 }],
  },
  reportCreate: {
    deviceBudgets: [{ limit: 5, windowSeconds: 10 * 60 }],
    networkBudgets: [{ limit: 30, windowSeconds: 10 * 60 }],
  },
  deviceRegister: {
    networkBudgets: [{ limit: 5, windowSeconds: 10 * 60 }],
  },
  location: {
    networkBudgets: [{ limit: 20, windowSeconds: 10 * 60 }],
  },
  cardRender: {
    networkBudgets: [{ limit: 60, windowSeconds: 10 * 60 }],
  },
  notificationVerify: {
    networkBudgets: [{ limit: 20, windowSeconds: 10 * 60 }],
  },
  candidateWrite: {
    accountBudgets: [{ limit: 30, windowSeconds: 10 * 60 }],
  },
} as const;

export type AbuseAction =
  | "post.create"
  | "post.agree.toggle"
  | "post.report"
  | "device.register"
  | "candidate.first_message"
  | "candidate.reply"
  | "location.resolve"
  | "location.search"
  | "card.render"
  | "notification.verify";
