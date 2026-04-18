/**
 * Tiện ích làm sạch dữ liệu (Transform) trước khi lưu vào DB.
 */

// Hàm loại bỏ khoảng trắng thừa, tab, xuống dòng rác
function cleanText(text) {
  if (!text) return null;
  return text.toString().replace(/\s+/g, " ").trim();
}

// Hàm chuẩn hóa URL (bỏ trailing slash, đảm bảo có https://)
function cleanUrl(url) {
  if (!url) return null;
  let cleaned = url.trim();
  if (!cleaned.startsWith("http")) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.endsWith("/") ? cleaned.slice(0, -1) : cleaned;
}

module.exports = {
  cleanText,
  cleanUrl,
};
