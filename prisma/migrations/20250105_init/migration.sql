-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('FP1', 'FP2', 'FP3', 'PRACTICE', 'QUALIFYING', 'RACE', 'TEST', 'OTHER');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETE', 'CANCELLED');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "SessionKind" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetrySample" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "speedKph" DOUBLE PRECISION,
    "throttlePct" DOUBLE PRECISION,
    "brakePct" DOUBLE PRECISION,
    "rpm" INTEGER,
    "gear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelemetrySample_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TelemetrySample_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TelemetrySample_sessionId_recordedAt_idx" ON "TelemetrySample"("sessionId", "recordedAt");

-- Trigger to update updatedAt
CREATE OR REPLACE FUNCTION set_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_updated_at
BEFORE UPDATE ON "Session"
FOR EACH ROW
EXECUTE FUNCTION set_session_updated_at();
