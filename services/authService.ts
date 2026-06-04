import { User } from "@/types/User";

export async function loginMock(): Promise<User> {
  return {
    userId: "USER#123",
    email: "levy@email.com",
    name: "Levy Candido",
    roles: ["ADMIN"],
    permissions: [
      "DASHBOARD_VIEW",
      "USERS_VIEW",
      "USERS_EDIT",
      "EVENTS_VIEW",
      "EVENTS_CREATE",
    ],
  };
}