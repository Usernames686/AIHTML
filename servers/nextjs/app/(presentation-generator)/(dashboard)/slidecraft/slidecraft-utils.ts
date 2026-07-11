import { SlideCraftGenerateResponse } from "@/app/(presentation-generator)/services/api/slidecraft";
import { ValidationItem } from "./slidecraft-config";

export const getValidationItems = (
  result: SlideCraftGenerateResponse | null
): ValidationItem[] => {
  const html = result?.html.toLowerCase() ?? "";
  const warnings = (result?.warnings ?? []).join(" ").toLowerCase();

  return [
    { label: "完整 HTML 文档", passed: Boolean(html.includes("<!doctype html") && html.includes("<html")) },
    { label: "包含幻灯片结构", passed: Boolean(html.includes("<section") && html.includes('class="slide')) },
    { label: "包含键盘翻页", passed: Boolean(html.includes("slidepresentation") || html.includes("keydown")) },
    { label: "无明显外链脚本", passed: Boolean(result?.html && !warnings.includes("external script") && !html.includes("<script src=")) },
  ];
};

export const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
};

export const slugify = (value: string) => {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "slidecraft-deck";
};

export const readResponseError = async (response: Response) => {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string") return payload.detail;
    if (typeof payload?.error === "string") return payload.error;
  } catch {
    return response.statusText;
  }

  return response.statusText;
};
