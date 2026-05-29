import { useState } from 'react';
import { db, getTrustedTime } from '../services/db';
import apiClient from '../services/apiClient';

export const useDownloadContent = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const downloadContent = async (contentId) => {
        setLoading(true);
        setProgress(10);

        try {
            const response = await apiClient.get(`/v1/contents/${contentId}/offline`);
            const data = response.data.data;

            setProgress(40);
            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
            const expiresAt = data.courseData?.deadline || (getTrustedTime() + SEVEN_DAYS);

            await db.courses.put({ ...data.courseData, expiresAt });
            await db.contents.put({ ...data.contentData, expiresAt });

            setProgress(60);

            const mediaUrls = data.mediaUrls || [];
            if (mediaUrls.length > 0) {
                const cache = await caches.open('offline-media-cache');
                for (let i = 0; i < mediaUrls.length; i++) {
                    try {
                        const req = new Request(mediaUrls[i], { mode: 'no-cors' });
                        const res = await fetch(req);
                        await cache.put(req, res);
                    } catch (err) {
                        console.warn("Khong the tai file dinh kem:", mediaUrls[i], err);
                    }
                    const currentProgress = 60 + Math.floor(((i + 1) / mediaUrls.length) * 40);
                    setProgress(currentProgress);
                }
            }

            alert('Tải bài học thành công!');
            return true;
        } catch (error) {
            console.error('Loi tai bai hoc:', error);
            alert('Tải lỗi, bạn kiểm tra mạng nhé.');
            return false;
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    return { downloadContent, loading, progress };
};
