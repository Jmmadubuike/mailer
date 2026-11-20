import mongoose from "mongoose";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const uri = process.env.DATABASE_URL;
const email = (process.env.SEED_EMAIL ?? "owner@example.com").toLowerCase();
const password = process.env.SEED_PASSWORD;
const name = process.env.SEED_NAME ?? "Owner";
const role = process.env.SEED_ROLE ?? "owner";

if (!uri) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

if (!password) {
  console.error("SEED_PASSWORD is required");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derived = await scrypt(password, salt, 64);
const passwordHash = `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;

await mongoose.connect(uri);

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ["owner", "administrator", "campaign_manager", "viewer"],
      default: "administrator",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

const User = mongoose.models.User ?? mongoose.model("User", userSchema);

const result = await User.findOneAndUpdate(
  { email },
  {
    $set: {
      name,
      email,
      passwordHash,
      role,
      isActive: true,
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

console.log(`Seeded ${role}: ${email} (id ${result._id})`);
await mongoose.disconnect();
