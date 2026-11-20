import "server-only";
import { User, type IUser, type UserRole } from "@/models/User";
import { hashPassword } from "@/lib/security/password";
import { AppError } from "@/lib/errors";

export async function listUsers(): Promise<IUser[]> {
  return User.find().sort({ createdAt: 1 }).lean();
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<IUser> {
  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) throw new AppError("A user with this email already exists", 409);

  const passwordHash = await hashPassword(input.password);
  return User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  });
}

export async function updateUser(
  id: string,
  input: { name?: string; role?: UserRole; isActive?: boolean },
): Promise<IUser> {
  const user = await User.findByIdAndUpdate(id, { $set: input }, { new: true });
  if (!user) throw new AppError("User not found", 404);
  return user;
}

export async function deleteUser(id: string, actorId: string): Promise<void> {
  if (id === actorId) {
    throw new AppError("You cannot delete your own account", 409);
  }
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError("User not found", 404);
}

export async function setUserPassword(id: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { passwordHash } },
    { new: true },
  );
  if (!user) throw new AppError("User not found", 404);
}
