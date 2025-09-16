-- CreateTable
CREATE TABLE "public"."Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "transponder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "team" TEXT,
    "car" TEXT,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lap" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "lapNumber" INTEGER NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "sector1Ms" INTEGER,
    "sector2Ms" INTEGER,
    "sector3Ms" INTEGER,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_name_transponder_key" ON "public"."Driver"("name", "transponder");

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_idx" ON "public"."SessionParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "SessionParticipant_driverId_idx" ON "public"."SessionParticipant"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_sessionId_driverId_key" ON "public"."SessionParticipant"("sessionId", "driverId");

-- CreateIndex
CREATE INDEX "Lap_sessionId_idx" ON "public"."Lap"("sessionId");

-- CreateIndex
CREATE INDEX "Lap_driverId_idx" ON "public"."Lap"("driverId");

-- CreateIndex
CREATE INDEX "Lap_sessionId_driverId_idx" ON "public"."Lap"("sessionId", "driverId");

-- AddForeignKey
ALTER TABLE "public"."SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionParticipant" ADD CONSTRAINT "SessionParticipant_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lap" ADD CONSTRAINT "Lap_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lap" ADD CONSTRAINT "Lap_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
