import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.liveRcEvent.upsert({
    where: { externalEventId: 30952 },
    update: {},
    create: {
      externalEventId: 30952,
      title: "2024 ROAR 1/10 Electric Off-Road Nationals",
      trackName: "HobbyTown HobbyPlex",
      facility: "Indoor Off-Road",
      city: "Omaha",
      region: "NE",
      country: "USA",
      timeZone: "America/Chicago",
      startTime: new Date("2024-08-08T15:00:00Z"),
      endTime: new Date("2024-08-12T02:00:00Z"),
      website: "https://www.hobbyplexraceway.com/",
    },
  });

  const raceClass = await prisma.liveRcClass.upsert({
    where: {
      eventId_externalClassId: { eventId: event.id, externalClassId: 91201 },
    },
    update: {},
    create: {
      eventId: event.id,
      externalClassId: 91201,
      name: "2WD Modified Buggy",
      description: "ROAR National Championship",
    },
  });

  const heat = await prisma.liveRcHeat.upsert({
    where: {
      classId_externalHeatId: { classId: raceClass.id, externalHeatId: 441250 },
    },
    update: {},
    create: {
      classId: raceClass.id,
      externalHeatId: 441250,
      label: "Round 3 Qualifier - Heat 1",
      round: 3,
      attempt: 1,
      scheduledStart: new Date("2024-08-09T21:40:00Z"),
      durationSeconds: 360,
      status: "complete",
      liveStreamUrl: "https://live.liverc.com/30952-2wd-mod-heat1",
    },
  });

  const entry = await prisma.liveRcEntry.upsert({
    where: {
      classId_externalEntryId: { classId: raceClass.id, externalEntryId: 558632 },
    },
    update: {},
    create: {
      classId: raceClass.id,
      externalEntryId: 558632,
      driverName: "Dakotah Phend",
      carNumber: "9",
      transponder: "1234567",
      vehicle: "TLR 22 5.0",
      sponsor: "TLR / Horizon Hobby",
      hometownCity: "Detroit",
      hometownRegion: "MI",
    },
  });

  await prisma.liveRcResult.upsert({
    where: {
      heatId_entryId: { heatId: heat.id, entryId: entry.id },
    },
    update: {
      finishPosition: 1,
      lapsCompleted: 12,
      totalTimeMs: 315420,
      fastLapMs: 25870,
      intervalMs: 0,
      status: "finished",
    },
    create: {
      heatId: heat.id,
      entryId: entry.id,
      externalResultId: 9912501,
      finishPosition: 1,
      lapsCompleted: 12,
      totalTimeMs: 315420,
      fastLapMs: 25870,
      intervalMs: 0,
      status: "finished",
    },
  });

  await prisma.session.upsert({
    where: { id: "seed-live-rc-session" },
    update: {},
    create: {
      id: "seed-live-rc-session",
      name: "Qualifying Heat 1",
      description: "LiveRC-bound session seeded for local testing",
      kind: "QUALIFYING",
      status: "SCHEDULED",
      scheduledStart: new Date("2024-08-09T21:40:00Z"),
      scheduledEnd: new Date("2024-08-09T21:46:00Z"),
      timingProvider: "LIVE_RC",
      liveRcHeatId: heat.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
