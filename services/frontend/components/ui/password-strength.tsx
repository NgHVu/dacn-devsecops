"use client";

import React, { useMemo } from "react";
import zxcvbn from "zxcvbn";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = "" }) => {
  // Logic useMemo giữ nguyên
  const { score, feedback } = useMemo(() => {
    if (!password || password.length === 0) {
      return {
        score: 0,
        feedback: null,
      };
    }

    const result = zxcvbn(password);
    let feedbackText: string | null = null;

    if (result.feedback.suggestions && result.feedback.suggestions.length > 0) {
      feedbackText = result.feedback.suggestions[0];
    } else if (result.feedback.warning) {
      feedbackText = result.feedback.warning;
    }

    return {
      score: result.score,
      feedback: feedbackText,
    };
  }, [password]);

  // Logic màu sắc giữ nguyên
  const scoreText = ["Rất yếu", "Yếu", "Trung bình", "Tốt", "Rất mạnh"];
  const scoreColor = [
    "bg-red-500",    // 0
    "bg-red-500",    // 1
    "bg-yellow-500", // 2
    "bg-green-500",  // 3
    "bg-green-600",  // 4
  ];
  const scoreTextColors = [
    "text-red-500",
    "text-red-500",
    "text-yellow-500",
    "text-green-500",
    "text-green-600",
  ];

  return (
    <div className="space-y-2 pt-1">
      {/* Thanh đo độ mạnh (giữ nguyên) */}
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-300",
            score > 0 ? scoreColor[score] : "bg-muted" 
          )}
          style={{ width: `${(score / 4) * 100}%` }}
        />
      </div>
      
      {/* Văn bản phản hồi */}
      {password.length > 0 && (
        // === SỬA LỖI TIẾNG ANH TẠI ĐÂY ===
        // Chỉ hiển thị phần "Độ mạnh" (Tiếng Việt)
        // Bỏ 'justify-between' và 'italic' feedback
        <div className="flex justify-start items-center">
          <p className={cn("text-xs", scoreTextColors[score])}>
            Độ mạnh: {scoreText[score]}
          </p>
          {/* Đã xóa bỏ phần hiển thị 'feedback' tiếng Anh:
            {feedback && (
              <p className="text-xs text-muted-foreground italic">
                {feedback}
              </p>
            )}
          */}
        </div>
        // === KẾT THÚC SỬA LỖI ===
      )}
    </div>
  );
};

export { PasswordStrength };