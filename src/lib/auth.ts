// =============================================================================
// NextAuth Configuration — Credentials Provider (single admin)
// =============================================================================
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const admin = await db.admin.findFirst({
          where: {
            OR: [
              { email: credentials.email.toLowerCase().trim() },
              { name: credentials.email.trim() }
            ]
          }
        });

        if (!admin) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          admin.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        if (!admin.isActive) {
          throw new Error("Your account has been disabled");
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          avatar: admin.avatar,
          isActive: admin.isActive,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        token.avatar = (user as any).avatar;
        token.isActive = (user as any).isActive;
      }

      // Handle updating the profile/session dynamically if needed
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.avatar) token.avatar = session.avatar;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
        session.user.isActive = token.isActive;
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      try {
        if (user?.id) {
          await db.admin.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
          await db.adminActivityLog.create({
            data: {
              adminId: user.id,
              action: "LOGIN",
              details: "Successfully logged in via credentials",
            },
          });
        }
      } catch (err) {
        console.error("Error in NextAuth signIn event:", err);
      }
    },
    async signOut({ token }) {
      try {
        if (token?.id) {
          await db.adminActivityLog.create({
            data: {
              adminId: token.id as string,
              action: "LOGOUT",
              details: "Logged out from admin panel",
            },
          });
        }
      } catch (err) {
        console.error("Error in NextAuth signOut event:", err);
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
