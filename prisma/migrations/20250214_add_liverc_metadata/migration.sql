-- CreateEnum
CREATE TYPE "TimingProvider" AS ENUM ('MANUAL', 'LIVE_RC');

-- AlterTable
ALTER TABLE "Session"
  ADD COLUMN     "timingProvider" "TimingProvider" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN     "liveRcHeatId" TEXT;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_liveRcHeatId_key" UNIQUE ("liveRcHeatId");

-- CreateTable
CREATE TABLE "LiveRcEvent" (
  "id" TEXT NOT NULL,
  "externalEventId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "trackName" TEXT,
  "facility" TEXT,
  "city" TEXT,
  "region" TEXT,
  "country" TEXT,
  "timeZone" TEXT,
  "startTime" TIMESTAMP(3),
  "endTime" TIMESTAMP(3),
  "website" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveRcEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveRcEvent_externalEventId_key" UNIQUE ("externalEventId")
);

-- CreateTable
CREATE TABLE "LiveRcClass" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "externalClassId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveRcClass_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveRcClass_eventId_externalClassId_key" UNIQUE ("eventId", "externalClassId"),
  CONSTRAINT "LiveRcClass_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "LiveRcEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveRcEntry" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "externalEntryId" INTEGER NOT NULL,
  "driverName" TEXT NOT NULL,
  "carNumber" TEXT,
  "transponder" TEXT,
  "vehicle" TEXT,
  "sponsor" TEXT,
  "hometownCity" TEXT,
  "hometownRegion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveRcEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveRcEntry_classId_externalEntryId_key" UNIQUE ("classId", "externalEntryId"),
  CONSTRAINT "LiveRcEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "LiveRcClass"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveRcHeat" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "externalHeatId" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "round" INTEGER,
  "attempt" INTEGER,
  "scheduledStart" TIMESTAMP(3),
  "durationSeconds" INTEGER,
  "status" TEXT,
  "liveStreamUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveRcHeat_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveRcHeat_classId_externalHeatId_key" UNIQUE ("classId", "externalHeatId"),
  CONSTRAINT "LiveRcHeat_classId_fkey" FOREIGN KEY ("classId") REFERENCES "LiveRcClass"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveRcResult" (
  "id" TEXT NOT NULL,
  "heatId" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "externalResultId" INTEGER NOT NULL,
  "finishPosition" INTEGER,
  "lapsCompleted" INTEGER,
  "totalTimeMs" INTEGER,
  "fastLapMs" INTEGER,
  "intervalMs" INTEGER,
  "status" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveRcResult_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveRcResult_heatId_entryId_key" UNIQUE ("heatId", "entryId"),
  CONSTRAINT "LiveRcResult_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "LiveRcHeat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LiveRcResult_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LiveRcEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AddForeignKey linking Session to LiveRcHeat
ALTER TABLE "Session"
  ADD CONSTRAINT "Session_liveRcHeatId_fkey" FOREIGN KEY ("liveRcHeatId") REFERENCES "LiveRcHeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "LiveRcEvent_startTime_idx" ON "LiveRcEvent"("startTime");
CREATE INDEX "LiveRcHeat_scheduledStart_idx" ON "LiveRcHeat"("scheduledStart");
