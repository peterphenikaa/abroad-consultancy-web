const prisma = require("./src/lib/prisma");

async function clearData() {
  try {
    console.log("Đang xóa dữ liệu cũ để cập nhật DB Schema...");
    const result = await prisma.rawUniversityData.deleteMany();
    console.log(`Đã xóa ${result.count} dòng.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
