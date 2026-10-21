// scripts/verify_super_admin_catalog.js
const http = require("http");

async function main() {
  console.log("=== 1. Logging in as Super Admin abokos@juromart.com ===");

  const loginPayload = JSON.stringify({
    email: "abokos@juromart.com",
    password: "Abokos@99",
  });

  const loginRes = await fetch("http://127.0.0.1:9000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginPayload),
    },
    body: loginPayload,
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const loginData = await loginRes.json();
  console.log("✓ Login Success! User:", loginData.user);

  if (loginData.user.role !== "ADMIN") {
    console.error("Error: User is not ADMIN, role is", loginData.user.role);
    process.exit(1);
  }

  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const accessToken = loginData.accessToken;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    Cookie: cookieHeader,
  };

  console.log("\n=== 2. Fetching current product overrides ===");
  const overridesRes = await fetch("http://127.0.0.1:9000/api/products/overrides");
  const overridesData = await overridesRes.json();
  console.log("✓ Overrides count:", overridesData.overrides?.length || 0);

  console.log("\n=== 3. Super Admin editing a product item (prod_earbuds) ===");
  // Reset promotion test: discountPercentage 0, originalPrice = price
  const updatePayload = {
    id: "prod_earbuds",
    name: "Wireless Noise-Canceling Earbuds Pro",
    category: "Phones & Tablets",
    subcategory: "Audio & Accessories",
    price: 4999,
    originalPrice: 4999, // 0% discount
    discountPercentage: 0, // Promotion Reset
    badge: "🔥 Best Seller",
    merchantStall: "Stall G14 - Verified CBD Flagship",
    description: "Super Admin updated description with verified sound tuning and full local warranty.",
  };

  const updateRes = await fetch("http://127.0.0.1:9000/api/products/update", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(updatePayload),
  });

  if (!updateRes.ok) {
    console.error("Product update failed:", updateRes.status, await updateRes.text());
    process.exit(1);
  }

  const updateResult = await updateRes.json();
  console.log("✓ Product updated successfully:", updateResult.product);

  console.log("\n=== 4. Testing Batch Reset Promotions for a Category ===");
  const batchResetRes = await fetch("http://127.0.0.1:9000/api/products/batch-reset-promotions", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      category: "Home Appliances",
    }),
  });

  if (!batchResetRes.ok) {
    console.error("Batch reset failed:", batchResetRes.status, await batchResetRes.text());
    process.exit(1);
  }

  const batchResult = await batchResetRes.json();
  console.log("✓ Batch promotion reset successful! Reset count:", batchResult.count);

  console.log("\n=== 5. Verifying Neon PostgreSQL Persistence ===");
  const verifyRes = await fetch("http://127.0.0.1:9000/api/products/overrides");
  const verifyData = await verifyRes.json();
  const savedItem = verifyData.overrides["prod_earbuds"];

  if (!savedItem || savedItem.discountPercentage !== 0 || savedItem.price !== 4999) {
    console.error("Verification failed: Override not persisted properly:", savedItem);
    process.exit(1);
  }

  console.log("✓ Verified in DB override:", savedItem);
  console.log("\n>>> ALL SUPER ADMIN CATALOG MANAGEMENT CAPABILITIES VERIFIED! <<<");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
