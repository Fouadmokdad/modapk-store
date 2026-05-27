// =============================================================================
// NextAuth Type Extensions
// =============================================================================
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar: string | null;
      isActive: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
    isActive: boolean;
  }
}
