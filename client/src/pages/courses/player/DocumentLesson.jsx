import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { DocumentViewer } from "../../../components/ui/DocumentViewer";
import { Button } from "../../../components/ui/button";

export default function DocumentLesson({
    contentItem,
    course,
    onMarkComplete,
    isMarkingComplete,
}) {
    if (!contentItem) return null;

    const seedContent = `
# Hướng dẫn chi tiết kỹ năng Reading

Tài liệu này cung cấp các chiến lược quan trọng để đạt điểm cao trong bài thi Reading.

## 1. Kỹ năng Skimming và Scanning

Đây là hai kỹ năng quan trọng nhất mà bạn cần nắm vững:

*   **Skimming (Đọc lướt):** Giúp bạn lấy ý chính của toàn bộ bài viết một cách nhanh chóng. Thường đọc câu đầu và câu cuối của mỗi đoạn.
*   **Scanning (Đọc quét):** Dùng để tìm kiếm các thông tin chi tiết cụ thể (tên riêng, ngày tháng, số liệu) mà không cần đọc hiểu toàn bộ câu.

### Ví dụ áp dụng
Dưới đây là bảng phân loại các dạng câu hỏi thường gặp:

## 2. Các dạng câu hỏi phổ biến

| Dạng câu hỏi | Tần suất xuất hiện | Độ khó | Chiến thuật chính |
| :--- | :---: | :---: | :--- |
| **True/False/Not Given** | Rất cao | Khó | Xác định từ khóa, chú ý từ đồng nghĩa |
| **Matching Headings** | Cao | Trung bình | Đọc lướt nắm ý chính đoạn văn |
| **Multiple Choice** | Trung bình | Dễ | Loại trừ đáp án sai một cách logic |

**Lưu ý quan trọng:** Luôn chú ý quản lý thời gian thật tốt. Đừng dành quá nhiều thời gian cho một câu hỏi khó.

Để biết thêm chi tiết, hãy tham khảo [Khóa học nâng cao](#).
`;

    return (
        <div className="w-full max-w-4xl mx-auto my-8 lg:my-12 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-200">
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold font-serif text-neutral-900 mb-2">
                    {contentItem.title}
                </h2>
                {course?.instructor && (
                    <p className="text-sm font-medium text-neutral-500">
                        By {course.instructor.name || course.instructor} {contentItem.updatedAt ? `• Updated ${new Date(contentItem.updatedAt).toLocaleDateString()}` : ''}
                    </p>
                )}
            </div>
            <div className="prose prose-lg max-w-none font-serif text-neutral-800">
                <DocumentViewer
                    url={contentItem.contentData || ""}
                    content={contentItem.content || seedContent}
                    type={contentItem.type}
                />
            </div>
            {!contentItem.isCompleted && (
                <div className="mt-12 pt-8 border-t border-neutral-100">
                    <Button
                        onClick={onMarkComplete}
                        disabled={isMarkingComplete}
                        className="w-full rounded-2xl py-6 font-bold shadow-sm bg-gray-900 hover:bg-black text-white transition-all duration-200"
                    >
                        {isMarkingComplete ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                        )}
                        Mark as Complete
                    </Button>
                </div>
            )}
        </div>
    );
}
