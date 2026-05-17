import { getApiUrl } from "@/utils/api";

export type SlideCraftStyle =
  | "neo-brutalism-3d"
  | "retro-futurism"
  | "maximalism-typography"
  | "naive-typography"
  | "bento-3d-glass"
  | "neo-minimalism"
  | "memphis"
  | "blueprint"
  | "editorial-magazine"
  | "cyber-terminal"
  | "course-workshop"
  | "investor-pitch"
  | "obsidian-pro"
  | "handdrawn-whiteboard"
  | "apple-keynote"
  | "data-dashboard"
  | "corporate-blue-gold";

export type SlideCraftGenerateParams = {
  topic: string;
  audience?: string | null;
  language?: string | null;
  n_slides: number;
  style: SlideCraftStyle;
  instructions?: string | null;
  include_speaker_notes: boolean;
};

export type SlideCraftGenerateResponse = {
  title: string;
  html: string;
  style: SlideCraftStyle;
  warnings: string[];
};

export class SlideCraftApi {
  static async generate(
    params: SlideCraftGenerateParams
  ): Promise<SlideCraftGenerateResponse> {
    const response = await fetch(getApiUrl("/api/v1/ppt/slidecraft/generate"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      cache: "no-cache",
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(message || "Failed to generate SlideCraft HTML");
    }

    return (await response.json()) as SlideCraftGenerateResponse;
  }
}

const readErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string") return payload.detail;
    if (typeof payload?.error === "string") return payload.error;
  } catch {
    return response.statusText;
  }

  return response.statusText;
};
