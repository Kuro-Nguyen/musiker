import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes cleanly without conflicting utilities.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format duration in seconds into monospace-friendly MM:SS (e.g. 30 -> "0:30").
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const rounded = Math.floor(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export interface DiscoveryLevelMeta {
  badge: string;
  title: string;
  description: string;
  zone: "safe" | "expand" | "smart" | "chaos";
}

/**
 * Map a Discovery Slider percentage (0-100) to its PRD label and zone metadata.
 */
export function getDiscoveryLevelMeta(level: number): DiscoveryLevelMeta {
  if (level <= 25) {
    return {
      badge: "SAFE ZONE",
      title: "Vùng an toàn",
      description: "Sát với nghệ sĩ & thể loại bạn đã chọn",
      zone: "safe",
    };
  }
  if (level <= 60) {
    return {
      badge: "LIGHT EXPAND",
      title: "Mở rộng nhẹ",
      description: "Nghệ sĩ liên quan & nhánh phụ cùng gu",
      zone: "expand",
    };
  }
  if (level <= 85) {
    return {
      badge: level === 80 ? "SMART DEFAULT" : "SMART DISCOVERY",
      title: "Khám phá thông minh",
      description: "Gần gu nhưng mới lạ, ít phổ biến hơn",
      zone: "smart",
    };
  }
  return {
    badge: "PURE RANDOM",
    title: "Ngẫu nhiên thuần túy",
    description: "Bỏ qua hồ sơ gu, khám phá ngẫu nhiên toàn cầu",
    zone: "chaos",
  };
}

