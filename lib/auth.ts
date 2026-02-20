import { auth } from "@clerk/nextjs/server";
import { Roles } from "@/types/global";

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
};

export const checkFounderOfMultipleStartups = async () => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.founderOfMultipleStartups || false;
};
