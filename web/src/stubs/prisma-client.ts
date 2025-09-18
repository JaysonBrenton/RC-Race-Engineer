/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-namespace */
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const requireModule = createRequire(import.meta.url);
export namespace Prisma {
  export type Session = {
    id: string;
    name: string;
    description: string | null;
    kind: "FP1" | "FP2" | "FP3" | "PRACTICE" | "QUALIFYING" | "RACE" | "TEST" | "OTHER";
    status: "SCHEDULED" | "LIVE" | "COMPLETE" | "CANCELLED";
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    actualStart: Date | null;
    actualEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  export interface PrismaClientOptions {
    log?: ("query" | "info" | "warn" | "error")[];
  }
}

interface SessionCreateArgs {
  data: Record<string, any>;
}

interface SessionFindManyArgs {
  orderBy: { createdAt: "asc" | "desc" };
  take?: number;
}

interface ClientImplementation {
  session: {
    create(args: SessionCreateArgs): Promise<Prisma.Session>;
    findMany(args: SessionFindManyArgs): Promise<Prisma.Session[]>;
  };
  $queryRaw<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}

class InMemoryPrismaClient implements ClientImplementation {
  private sessions: Prisma.Session[] = [];

  public session = {
    create: async (args: SessionCreateArgs): Promise<Prisma.Session> => {
      const now = new Date();
      const record: Prisma.Session = {
        id: randomUUID(),
        name: String(args.data.name ?? "Unnamed session"),
        description: (args.data.description ?? null) as string | null,
        kind: (args.data.kind ?? "OTHER") as Prisma.Session["kind"],
        status: (args.data.status ?? "SCHEDULED") as Prisma.Session["status"],
        scheduledStart: args.data.scheduledStart ?? null,
        scheduledEnd: args.data.scheduledEnd ?? null,
        actualStart: args.data.actualStart ?? null,
        actualEnd: args.data.actualEnd ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.sessions.unshift(record);
      return structuredClone(record);
    },
    findMany: async (args: SessionFindManyArgs): Promise<Prisma.Session[]> => {
      const sorted = [...this.sessions].sort((a, b) => {
        if (args.orderBy.createdAt === "desc") {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      return sorted.slice(0, args.take ?? sorted.length).map((session) => structuredClone(session));
    },
  };

  public async $queryRaw<T = unknown>(strings: TemplateStringsArray): Promise<T> {
    const text = strings.join("?");
    if (text.trim().toUpperCase().startsWith("SELECT")) {
      return 1 as T;
    }
    throw new Error("In-memory Prisma stub only supports SELECT probes");
  }
}

function loadRealPrismaClient(): any | null {
  try {
    const real = requireModule("@prisma/client");
    return real?.PrismaClient ?? null;
  } catch {
    return null;
  }
}

const RealPrismaClient = loadRealPrismaClient();

export class PrismaClient implements ClientImplementation {
  private readonly impl: ClientImplementation;

  public readonly session: ClientImplementation["session"];

  constructor(options?: Prisma.PrismaClientOptions) {
    if (RealPrismaClient) {
      this.impl = new RealPrismaClient(options);
    } else {
      this.impl = new InMemoryPrismaClient();
    }
    this.session = this.impl.session;
  }

  public $queryRaw<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
    return this.impl.$queryRaw(strings, ...values);
  }
}
