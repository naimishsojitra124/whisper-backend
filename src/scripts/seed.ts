import bcrypt from "bcryptjs";
import 'dotenv/config';
import { AuditLogModel } from "../models/AuditLog.model";
import { ReadReceiptModel } from "../models/ReadReceipt.model";
import { MessageModel } from "../models/Message.model";
import { MemberModel } from "../models/Member.model";
import { ConversationModel } from "../models/Conversation.model";
import { DeviceModel } from "../models/Device.model";
import { UserModel } from "../models/User.model";
import { AuditAction, ConversationType, MemberRole, MessageType } from "../types/enum";
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || "http://localhost:mongo_url";

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error('❌ MONGO_URI is missing');
  }

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });

  console.log('✅ MongoDB connected (seed)');
}
const RAW_PASSWORD = "2@54e9cEaHy";
const SALT_ROUNDS = 12;

async function seed() {
  await connectDB();

  
  await Promise.all([
    AuditLogModel.deleteMany(),
    ReadReceiptModel.deleteMany(),
    MessageModel.deleteMany(),
    MemberModel.deleteMany(),
    ConversationModel.deleteMany(),
    DeviceModel.deleteMany(),
    UserModel.deleteMany(),
  ]);

  console.log("🧹 Database cleared");

  // ---------------- USERS ----------------
  const passwordHash = await bcrypt.hash(RAW_PASSWORD, SALT_ROUNDS);

  const users = await UserModel.insertMany(
    usersData.map((u) => ({
      ...u,
      password: passwordHash,
      avatar: userAvatar(u.username),
      emailVerified: Math.random() > 0.2 ? new Date() : undefined,
      lastLoginAt: new Date(),
    }))
  );

  console.log("👤 Users seeded");

  // ---------------- DEVICES ----------------
  await DeviceModel.insertMany(
    users.map((u, i) => ({
      userId: u._id,
      deviceType: ["web", "mobile", "desktop"][i % 3],
      userAgent: i % 2 ? "Chrome 121" : "iOS Safari",
      ipAddress: `192.168.1.${20 + i}`,
      geoLocation: i % 2 ? "Ahmedabad, India" : "Rajkot, India",
    }))
  );

  console.log("📱 Devices seeded");

  // ---------------- CONVERSATIONS ----------------
  const conversations: any[] = [];
  // const seen = new Set<string>();

  // Direct chats (unique)
  for (let i = 0; i < 10; i++) {
    const members = shuffle(users).slice(0, Math.floor(Math.random() * 5) + 3);
    const creator = members[0];

    conversations.push({
      type: ConversationType.GROUP,
      title: groupTitles[i],
      members,
      createdBy: creator,
      groupAvatar: groupAvatar(groupTitles[i]),
    });
  }

  const savedConvos = await ConversationModel.insertMany(
    conversations.map((c) => ({
      type: c.type,
      title: c.title,
      groupAvatar: c.groupAvatar,
      createdById: c.createdBy._id,
    }))
  );

  
  console.log("💬 Conversations seeded");

  // ---------------- MEMBERS ----------------
   await MemberModel.insertMany(
    savedConvos.flatMap((c, i) =>
      conversations[i].members.map((u: any) => ({
        conversationId: c._id,
        userId: u._id,
        role: u._id.equals(conversations[i].createdBy._id)
          ? MemberRole.ADMIN
          : MemberRole.MEMBER
      }))
    )
  );

  console.log("👥 Members seeded");

  // ---------------- MESSAGES ----------------
  const messages: any[] = [];

for (let i = 0; i < 120; i++) {
  const convoIndex = i % savedConvos.length;
  const convo = savedConvos[convoIndex];
  const convoMeta = conversations[convoIndex];

  const sender = randomElement(convoMeta.members) as any;

  const mod = i % 4;

  // TEXT
  if (mod === 0) {
    messages.push({
      conversationId: convo._id,
      senderId: sender._id,
      type: MessageType.TEXT,
      content: randomElement(textMessages)
    });
  }

  // IMAGE
  else if (mod === 1) {
    messages.push({
      conversationId: convo._id,
      senderId: sender._id,
      type: MessageType.IMAGE,
      content: randomElement(imageUrls)
    });
  }

  // SYSTEM (GROUP ONLY)
  else if (mod === 2 && convo.type === ConversationType.GROUP) {
    const sys = randomElement(systemMessageTemplates)(convoMeta);

    messages.push({
      conversationId: convo._id,
      senderId: convo.createdById, // admin/system authority
      type: MessageType.SYSTEM,
      content: sys.content,
      metadata: sys.metadata
    });
  }

  // NUDGE
  else {
    const target = randomElement(
      convoMeta.members.filter((m: any) => !m._id.equals(sender._id))
    ) as any;

    messages.push({
      conversationId: convo._id,
      senderId: sender._id,
      type: MessageType.NUDGE,
      content: '👋 Hey, are you there?',
      metadata: { targetUserId: target?._id }
    });
  }
}

await MessageModel.insertMany(messages);


  console.log("✉️ Messages seeded");


  // ---------------- READ RECEIPTS ----------------
  // await ReadReceiptModel.insertMany(
  //   messages.flatMap(m => [
  //     { messageId: m._id, userId: m.senderId }
  //   ])
  // );

  // console.log("👀 Read receipts seeded");

  // ---------------- AUDIT LOGS ----------------

   await AuditLogModel.insertMany(
    Array.from({ length: 20 }).map((_, i) => ({
      userId: users[i % users.length]._id,
      action: randomElement(auditActions),
      ipAddress: `10.0.0.${i + 10}`,
      path: '/auth/login',
      method: 'POST',
      metadata: { attempt: i + 1 }
    }))
  );
  console.log("🕵️ Audit logs seeded");
  console.log("✅ SEED COMPLETED SUCCESSFULLY");
  process.exit(0);
}

// ---------------- HELPERS ----------------
const usersData = [
  {
    userId: 1045,
    username: "aarav",
    firstName: "Aarav",
    lastName: "Shah",
    email: "aarav.s@whisper.dev",
  },
  {
    userId: 1088,
    username: "ishita",
    firstName: "Ishita",
    lastName: "Mehta",
    email: "ishita.m@whisper.dev",
  },
  {
    userId: 1123,
    username: "rahul",
    firstName: "Rahul",
    lastName: "Verma",
    email: "rahul.v@whisper.dev",
  },
  {
    userId: 1199,
    username: "kavya",
    firstName: "Kavya",
    lastName: "Iyer",
    email: "kavya.i@whisper.dev",
  },
  {
    userId: 1012,
    username: "janvi",
    firstName: "Janvi",
    lastName: "Jethwani",
    email: "janvi.j@whisper.dev",
  },
  {
    userId: 1210,
    username: "rohan",
    firstName: "Rohan",
    lastName: "Malhotra",
    email: "rohan.m@whisper.dev",
  },
  {
    userId: 1301,
    username: "aditya",
    firstName: "Aditya",
    lastName: "Kulkarni",
    email: "aditya.k@whisper.dev",
  },
  {
    userId: 1380,
    username: "sneha",
    firstName: "Sneha",
    lastName: "Patel",
    email: "sneha.p@whisper.dev",
  },
  {
    userId: 1456,
    username: "vishal",
    firstName: "Vishal",
    lastName: "Rana",
    email: "vishal.r@whisper.dev",
  },
  {
    userId: 1502,
    username: "neha",
    firstName: "Neha",
    lastName: "Kapoor",
    email: "neha.k@whisper.dev",
  },
];

// Group chats
const groupTitles = [
  "Whisper Core Team",
  "Cybersecurity ME Batch",
  "Weekend Hackers",
  "Startup Ideas",
  "Late Night Debugging",
  "Frontend Guild",
  "Backend Architects",
  "DevSecOps Circle",
  "Rajkot Friends",
  "Random Banter",
];


const imageUrls = [
    "https://picsum.photos/seed/chat1/600/400",
    "https://picsum.photos/seed/chat2/600/400",
    "https://picsum.photos/seed/chat3/600/400",
    "https://picsum.photos/seed/chat4/600/400",
  ];

  const textMessages = [
    "Did you push the latest changes?",
    "This build finally works 🎉",
    "Let’s review this tomorrow.",
    "There’s a race condition here.",
    "Anyone up for a quick call?",
  ];

  const systemMessageTemplates = [
  (convo: any) => ({
    content: 'member_joined_via_invite',
    metadata: { userId: (randomElement(convo.members) as any)._id }
  }),
  (convo: any) => ({
    content: 'member_promoted_to_admin',
    metadata: {
      userId: (randomElement(convo.members) as any)._id,
      promotedBy: convo.createdBy._id
    }
  }),
  (convo: any) => ({
    content: 'member_left_group',
    metadata: { userId: (randomElement(convo.members) as any)._id }
  }),
  (convo: any) => ({
    content: 'group_icon_updated',
    metadata: { userId: convo.createdBy._id }
  }),
  (convo: any) => ({
    content: 'group_name_changed',
    metadata: {
      oldName: convo.title,
      newName: `${convo.title} v2`
    }
  })
];


 const auditActions = [
  AuditAction.LOGIN_SUCCESS,
  AuditAction.LOGIN_FAILED,
  AuditAction.LOGOUT,
  AuditAction.SUSPICIOUS_ACTIVITY
];


function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function userAvatar(username: string) {
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${username}`;
}

function groupAvatar(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/300/300`;
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
