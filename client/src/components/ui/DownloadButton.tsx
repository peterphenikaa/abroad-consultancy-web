import React, { useEffect, useState } from 'react';
import { db, getOfflineDataSafely } from '../../services/db';
import { useDownloadContent } from '../../hooks/useDownloadContent';
import { DownloadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from './utils';

interface DownloadButtonProps {
    contentId: string | number;
    className?: string;
}

export default function DownloadButton({ contentId, className }: DownloadButtonProps) {
    const { downloadContent, loading, progress } = useDownloadContent();
    const [isDownloaded, setIsDownloaded] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const checkDownloaded = async () => {
            try {
                // @ts-ignore
                const offlineData = await getOfflineDataSafely(db.contents, contentId.toString());
                if (isMounted) setIsDownloaded(!!offlineData);
            } catch (error) {
                console.error("Lỗi tra cứu offline DB:", error);
            }
        };
        checkDownloaded();

        return () => {
            isMounted = false;
        };
    }, [contentId]);

    const handleDownload = async () => {
        const success = await downloadContent(contentId);
        if (success) {
            setIsDownloaded(true);
        }
    };

    if (isDownloaded) {
        return (
            <Button
                variant="outline"
                className={cn("text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700", className)}
                disabled
            >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Đã tải
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            disabled={loading}
            className={cn("text-neutral-600 hover:text-primary", className)}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải {progress}%
                </>
            ) : (
                <>
                    <DownloadCloud className="w-4 h-4 mr-2" /> Tải offline
                </>
            )}
        </Button>
    );
}
