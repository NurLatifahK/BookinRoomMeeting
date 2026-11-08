// Using native Node 18+ global fetch
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Automated Integration Tests for Bank Raya Booking System...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // Test 1: Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json() as any;
    assert(healthRes.status === 200 && healthJson.status === 'ok', 'API Health Check returns 200 OK');

    // Test 2: Invalid Login
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin.raya', password: 'WrongPassword' }),
    });
    assert(badLoginRes.status === 401, 'Invalid password correctly rejected with 401');

    // Test 3: Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin.raya', password: 'Admin123' }),
    });
    const adminLoginJson = await adminLoginRes.json() as any;
    const adminToken = adminLoginJson.data?.token;
    assert(
      adminLoginRes.status === 200 && adminLoginJson.data?.user?.role === 'ADMIN',
      'Admin login successful with role ADMIN'
    );

    // Test 4: Pegawai 1 Login
    const peg1Res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'pegawai001', password: 'Raya123' }),
    });
    const peg1Json = await peg1Res.json() as any;
    const peg1Token = peg1Json.data?.token;
    assert(
      peg1Res.status === 200 &&
        peg1Json.data?.user?.role === 'PEGAWAI' &&
        peg1Json.data?.user?.pn === 'BR-10294',
      'Pegawai 1 login successful with PN BR-10294'
    );

    // Test 5: Pegawai 2 Login
    const peg2Res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'pegawai002', password: 'Raya123' }),
    });
    const peg2Json = await peg2Res.json() as any;
    const peg2Token = peg2Json.data?.token;
    assert(
      peg2Res.status === 200 &&
        peg2Json.data?.user?.role === 'PEGAWAI' &&
        peg2Json.data?.user?.pn === 'BR-10385',
      'Pegawai 2 login successful with PN BR-10385'
    );

    // Test 6: Verify 15 Meeting Rooms
    const roomsRes = await fetch(`${BASE_URL}/rooms`, {
      headers: { Authorization: `Bearer ${peg1Token}` },
    });
    const roomsJson = await roomsRes.json() as any;
    const rooms = roomsJson.data || [];
    assert(rooms.length === 15, `Found exactly 15 rooms (actual: ${rooms.length})`);

    const targetRoom = rooms.find((r: any) => r.code === 'MR-12-02') || rooms[0];

    // Compute a test date 2 days in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const testDate = futureDate.toISOString().split('T')[0];

    // Test 7: Pegawai 1 creates booking (10:00 - 12:00, 2 jam)
    const book1Res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peg1Token}`,
      },
      body: JSON.stringify({
        roomId: targetRoom.id,
        date: testDate,
        startTime: '10:00',
        duration: 2,
        title: 'Rapat Strategis Pegawai 1',
        description: 'Pembahasan target kuartal',
      }),
    });
    const book1Json = await book1Res.json() as any;
    const book1Id = book1Json.data?.id;
    assert(
      book1Res.status === 201 && book1Json.data?.endTime === '12:00',
      'Pegawai 1 successfully booked 10:00 - 12:00 (End time automatically calculated as 12:00)'
    );

    // Test 8: Conflict Detection - Pegawai 2 attempts to book overlapping time (11:00 - 13:00)
    const clashRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peg2Token}`,
      },
      body: JSON.stringify({
        roomId: targetRoom.id,
        date: testDate,
        startTime: '11:00',
        duration: 2,
        title: 'Meeting yang Bentrok',
      }),
    });
    assert(
      clashRes.status === 409,
      'Backend successfully rejected overlapping booking with 409 Conflict'
    );

    // Test 9a: Different User Consecutive Booking - Pegawai 2 tries booking without buffer (12:00 - 14:00, right after Pegawai 1's 10:00 - 12:00)
    const consecutiveDeniedRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peg2Token}`,
      },
      body: JSON.stringify({
        roomId: targetRoom.id,
        date: testDate,
        startTime: '12:00',
        duration: 2,
        title: 'Meeting Berurutan Pegawai 2 (Tanpa Jeda)',
      }),
    });
    assert(
      consecutiveDeniedRes.status === 409,
      'Consecutive booking by different user without 30-min buffer correctly rejected with 409 Conflict'
    );

    // Test 9b: Different User with 30-min Buffer (12:30 - 14:30) is allowed
    const consecutiveAllowedRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peg2Token}`,
      },
      body: JSON.stringify({
        roomId: targetRoom.id,
        date: testDate,
        startTime: '12:30',
        duration: 2,
        title: 'Meeting Pegawai 2 dengan Jeda 30 Menit',
      }),
    });
    assert(
      consecutiveAllowedRes.status === 201,
      'Booking with >= 30 mins buffer between different users successfully allowed (201 Created)'
    );

    // Test 10: Role Security - Pegawai 2 tries to edit Pegawai 1's booking
    const unauthorizedEditRes = await fetch(`${BASE_URL}/bookings/${book1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peg2Token}`,
      },
      body: JSON.stringify({
        title: 'Hacked Title',
      }),
    });
    assert(
      unauthorizedEditRes.status === 403,
      'Pegawai 2 editing Pegawai 1 booking correctly denied with 403 Forbidden'
    );

    // Test 11: Pegawai 1 cancels their own booking
    const cancelRes = await fetch(`${BASE_URL}/bookings/${book1Id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peg1Token}`,
      },
      body: JSON.stringify({
        reason: 'Jadwal diundur oleh pimpinan divisi',
      }),
    });
    const cancelJson = await cancelRes.json() as any;
    assert(
      cancelRes.status === 200 && cancelJson.data?.status === 'CANCELLED',
      'Pegawai 1 successfully cancelled own booking'
    );

    // Test 12: Slot Reusability - Pegawai 2 can now book the cancelled slot (10:00 - 12:00)
    const reuseRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peg2Token}`,
      },
      body: JSON.stringify({
        roomId: targetRoom.id,
        date: testDate,
        startTime: '10:00',
        duration: 2,
        title: 'Meeting Pengganti Pegawai 2',
      }),
    });
    assert(
      reuseRes.status === 201,
      'Previously cancelled slot successfully freed and bookable by another employee'
    );

    // Test 13: Admin Room Management
    const updateRoomRes = await fetch(`${BASE_URL}/rooms/${targetRoom.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        capacity: 25,
        facilities: 'Dual Screen 85", Cisco Webex, Whiteboard, High-Speed WiFi',
      }),
    });
    assert(
      updateRoomRes.status === 200,
      'Admin successfully updated room capacity and facilities'
    );

    console.log(`\n===========================================================`);
    console.log(`🎯 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`===========================================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
