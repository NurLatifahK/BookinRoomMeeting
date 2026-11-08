import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Bank Raya Meeting Room Booking System...');

  // Clean up existing data
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const adminPasswordHash = await bcrypt.hash('Admin123', 10);
  const employeePasswordHash = await bcrypt.hash('Raya123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin.raya',
      password: adminPasswordHash,
      name: 'Admin Raya',
      pn: 'ADM-001',
      role: 'ADMIN',
      division: 'Corporate Secretariat & GA',
    },
  });

  const pegawai1 = await prisma.user.create({
    data: {
      username: 'pegawai001',
      password: employeePasswordHash,
      name: 'Budi Santoso',
      pn: 'BR-10294',
      role: 'PEGAWAI',
      division: 'Digital Banking',
    },
  });

  const pegawai2 = await prisma.user.create({
    data: {
      username: 'pegawai002',
      password: employeePasswordHash,
      name: 'Siti Rahmawati',
      pn: 'BR-10385',
      role: 'PEGAWAI',
      division: 'Risk Management & Compliance',
    },
  });

  console.log(`Created 3 dummy users (1 Admin, 2 Pegawai)`);

  // 2. Create Rooms
  // Floors: 12, 15, 16, 17, 19
  // 3 rooms per floor: Meeting Room 1, Meeting Room 2, Meeting Room 3
  const floors = [12, 15, 16, 17, 19];
  const roomTemplates = [
    {
      num: 1,
      capacity: 12,
      facilities: 'Smart TV 75", Video Conference Polycom, Whiteboard, Wi-Fi 6',
      description: 'Ruang meeting representatif untuk koordinasi tim dan presentasi manajemen.',
    },
    {
      num: 2,
      capacity: 8,
      facilities: 'Smart TV 55", Web Camera Logitech, Whiteboard, Wi-Fi 6',
      description: 'Ruang meeting medium untuk sprint planning dan rapat harian divisi.',
    },
    {
      num: 3,
      capacity: 18,
      facilities: 'Dual Display 65", Dual Mic, Audio System, Whiteboard, Wi-Fi 6',
      description: 'Ruang konferensi kapasitas besar untuk rapat lintas divisi dan townhall.',
    },
  ];

  const createdRooms: any[] = [];

  for (const floor of floors) {
    for (const tpl of roomTemplates) {
      const room = await prisma.room.create({
        data: {
          name: `Meeting Room ${tpl.num}`,
          floor: floor,
          code: `MR-${floor}-0${tpl.num}`,
          capacity: tpl.capacity,
          facilities: tpl.facilities,
          status: 'AVAILABLE',
          description: `Lantai ${floor} - ${tpl.description}`,
        },
      });
      createdRooms.push(room);
    }
  }

  console.log(`Created ${createdRooms.length} rooms across floors 12, 15, 16, 17, 19`);

  // 3. Create Sample Bookings for today and tomorrow
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const todayStr = formatDate(today);
  
  // Helper Next Business Day (H+1 kerja)
  const getNextBusinessDay = (from: Date) => {
    const next = new Date(from);
    const day = next.getDay();
    if (day === 5) next.setDate(next.getDate() + 3); // Jumat -> Senin
    else if (day === 6) next.setDate(next.getDate() + 2); // Sabtu -> Senin
    else if (day === 0) next.setDate(next.getDate() + 1); // Minggu -> Senin
    else next.setDate(next.getDate() + 1);
    return next;
  };

  const nextBusinessDay = getNextBusinessDay(today);
  const nextBusinessDayStr = formatDate(nextBusinessDay);

  // Sample booking 1: Pegawai 1 on Floor 12 Room 1 today 09:00 - 11:00 (2 jam)
  const room12_1 = createdRooms.find((r) => r.code === 'MR-12-01');
  if (room12_1) {
    await prisma.booking.create({
      data: {
        title: 'Sprint Planning Tim Digital Banking Raya',
        description: 'Review backlog Q4 dan perencanaan fitur tabungan digital',
        userId: pegawai1.id,
        employeeName: pegawai1.name,
        employeePn: pegawai1.pn,
        roomId: room12_1.id,
        date: todayStr,
        startTime: '09:00',
        duration: 2,
        endTime: '11:00',
        status: 'CONFIRMED',
      },
    });

    // Consecutive booking in same room: 11:00 - 12:00 (1 jam) to prove consecutive bookings work!
    await prisma.booking.create({
      data: {
        title: 'Daily Standup Sync Architecture',
        description: 'Sync mingguan arsitektur mikroservis',
        userId: pegawai2.id,
        employeeName: pegawai2.name,
        employeePn: pegawai2.pn,
        roomId: room12_1.id,
        date: todayStr,
        startTime: '11:00',
        duration: 1,
        endTime: '12:00',
        status: 'CONFIRMED',
      },
    });
  }

  // Sample booking 2: Pegawai 2 on Floor 15 Room 2 today 14:00 - 16:00 (2 jam)
  const room15_2 = createdRooms.find((r) => r.code === 'MR-15-02');
  if (room15_2) {
    await prisma.booking.create({
      data: {
        title: 'Audit & Risk Assessment Internal',
        description: 'Evaluasi kepatuhan regulasi OJK dan BI',
        userId: pegawai2.id,
        employeeName: pegawai2.name,
        employeePn: pegawai2.pn,
        roomId: room15_2.id,
        date: todayStr,
        startTime: '14:00',
        duration: 2,
        endTime: '16:00',
        status: 'CONFIRMED',
      },
    });
  }

  // Sample booking 3: Tomorrow Floor 17 Room 1
  const room17_1 = createdRooms.find((r) => r.code === 'MR-17-01');
  if (room17_1) {
    await prisma.booking.create({
      data: {
        title: 'Koordinasi Operasional & Layanan Nasabah',
        description: 'Persiapan rollout update aplikasi mobile',
        userId: pegawai1.id,
        employeeName: pegawai1.name,
        employeePn: pegawai1.pn,
        roomId: room17_1.id,
        date: nextBusinessDayStr,
        startTime: '10:00',
        duration: 3,
        endTime: '13:00',
        status: 'CONFIRMED',
      },
    });
  }

  console.log('Sample bookings created successfully.');
  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

