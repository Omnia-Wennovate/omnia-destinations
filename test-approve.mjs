// Quick test to verify the approve-booking API works
const BASE_URL = 'http://localhost:3000';

async function testApproveBooking() {
  // First, let's list bookings to find one to test with
  console.log('Testing approve-booking API...\n');

  try {
    const res = await fetch(`${BASE_URL}/api/admin/approve-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: 'TEST_BOOKING_ID',
        adminId: 'test-admin',
      }),
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testApproveBooking();
