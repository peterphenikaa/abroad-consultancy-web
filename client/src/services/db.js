import Dexie from 'dexie';

class OfflineDatabase extends Dexie {
  constructor() {
    super('DuHocOfflineDB');

    this.version(3).stores({
      courses: 'id, expiresAt',
      contents: 'id, expiresAt', 
      quizzes: 'id, courseId, expiresAt', 
      progress: 'id, synced' 
    });
  }
}

export const db = new OfflineDatabase();

/**
 * Lắng nghe và đồng bộ thời gian từ Server
 * Gọi hàm này bất cứ khi nào có API trả về thời gian của Server (ví dụ lúc đăng nhập)
 * @param {number} serverTimeMs - Thời gian thực tế từ server (milliseconds)
 */
export const syncServerTime = (serverTimeMs) => {
  if (!serverTimeMs) return;
  const offset = serverTimeMs - Date.now();
  localStorage.setItem('serverTimeOffset', offset.toString());
};

/**
 * Lấy thời gian hiện tại "đáng tin cậy" (đã bù trừ việc user đổi giờ hệ thống)
 * @returns {number} Thời gian hiện tại (milliseconds)
 */
export const getTrustedTime = () => {
  const offsetStr = localStorage.getItem('serverTimeOffset');
  const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
  return Date.now() + offset;
};

/**
 * Quét và xóa toàn bộ dữ liệu đã hết hạn.
 * Bạn có thể gọi hàm này ở App.jsx hoặc main.jsx khi ứng dụng vừa khởi động.
 */
export const cleanupExpiredData = async () => {
  const trustedTime = getTrustedTime();
  
  try {
    await db.transaction('rw', db.courses, db.contents, db.quizzes, async () => {
      await db.courses.where('expiresAt').below(trustedTime).delete();
      await db.contents.where('expiresAt').below(trustedTime).delete();
      await db.quizzes.where('expiresAt').below(trustedTime).delete();
    });
    console.log('[Offline DB] Đã dọn dẹp các dữ liệu hết hạn thành công.');
  } catch (error) {
    console.error('[Offline DB] Lỗi khi dọn dẹp dữ liệu:', error);
  }
};

/**
 * Hàm lấy data an toàn. Nếu quá hạn sẽ trả về null và tự động xóa.
 * @param {Dexie.Table} table - Bảng truy vấn (vd: db.courses)
 * @param {string} id - ID của record
 */
export const getOfflineDataSafely = async (table, id) => {
  const data = await table.get(id);
  if (!data) return null;

  if (data.expiresAt) {
    const trustedTime = getTrustedTime();
    if (trustedTime > data.expiresAt) {
      await table.delete(id);
      return null;
    }
  }
  
  return data;
};