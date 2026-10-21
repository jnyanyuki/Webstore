// scripts/verify_super_admin_images.js
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== 1. Logging in as Super Admin abokos@juromart.com ===");

  const loginRes = await fetch("http://127.0.0.1:9000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "abokos@juromart.com",
      password: "Abokos@99",
    }),
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const loginData = await loginRes.json();
  const accessToken = loginData.accessToken;

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    Cookie: cookieHeader,
  };

  console.log("✓ Login Success! Super Admin:", loginData.user.email);

  console.log("\n=== 2. Super Admin Uploading Image File via POST /api/products/upload-image ===");
  // Sample 1x1 transparent PNG data URI
  const sampleDataUri =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  const uploadRes = await fetch("http://127.0.0.1:9000/api/products/upload-image", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      dataUrl: sampleDataUri,
      filename: "test_angle_1.png",
      productId: "prod_earbuds",
    }),
  });

  if (!uploadRes.ok) {
    console.error("Image upload failed:", uploadRes.status, await uploadRes.text());
    process.exit(1);
  }

  const uploadResult = await uploadRes.json();
  console.log("✓ Image uploaded successfully:", uploadResult);

  // Check file exists on disk
  const writtenFilePath = path.join(__dirname, "../apps/web/public", uploadResult.url);
  if (!fs.existsSync(writtenFilePath)) {
    console.error("Error: Uploaded file not found on disk at", writtenFilePath);
    process.exit(1);
  }
  console.log("✓ File verified on filesystem:", writtenFilePath);

  console.log("\n=== 3. Assigning Multiple Images to Product (prod_earbuds) ===");
  const testImages = [
    uploadResult.url,
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=85",
    "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=900&q=85",
  ];

  const updateRes = await fetch("http://127.0.0.1:9000/api/products/update", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      id: "prod_earbuds",
      price: 4999,
      frontImage: testImages[0],
      sideImage: testImages[1],
      images: testImages,
      gallery: [
        { url: testImages[0], label: "Primary Angle" },
        { url: testImages[1], label: "Side View" },
        { url: testImages[2], label: "Case & Accessories" },
      ],
    }),
  });

  if (!updateRes.ok) {
    console.error("Product image update failed:", updateRes.status, await updateRes.text());
    process.exit(1);
  }

  const updateResult = await updateRes.json();
  console.log("✓ Product updated with multi-images:", {
    id: updateResult.product.id,
    frontImage: updateResult.product.frontImage,
    sideImage: updateResult.product.sideImage,
    images: updateResult.product.images,
    galleryCount: updateResult.product.gallery?.length,
  });

  console.log("\n=== 4. Verifying Neon PostgreSQL Persistence for Images ===");
  const verifyRes = await fetch("http://127.0.0.1:9000/api/products/overrides");
  const verifyData = await verifyRes.json();
  const savedItem = verifyData.overrides["prod_earbuds"];

  if (!savedItem || !savedItem.images || savedItem.images.length !== 3) {
    console.error("Verification failed: Images not persisted properly:", savedItem);
    process.exit(1);
  }

  console.log("✓ Verified in DB override:", {
    id: savedItem.id,
    imagesCount: savedItem.images.length,
    frontImage: savedItem.frontImage,
    images: savedItem.images,
  });

  console.log("\n>>> ALL SUPER ADMIN IMAGE UPLOAD & GALLERY CAPABILITIES VERIFIED! <<<");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
