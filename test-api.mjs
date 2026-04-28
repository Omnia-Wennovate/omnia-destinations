async function testApprove() {
  console.log("Testing API route /api/admin/approve-booking...");
  const res = await fetch("http://127.0.0.1:3000/api/admin/approve-booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: "8YFdNch60thfrZqoGyC9", adminId: "admin" })
  });
  
  const data = await res.json();
  console.log("Response:", res.status, data);
}

testApprove().catch(console.error);
