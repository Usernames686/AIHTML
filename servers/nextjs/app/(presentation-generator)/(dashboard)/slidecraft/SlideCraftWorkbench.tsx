"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Download,
  Eye,
  FileText,
  Maximize2,
  Palette,
  RefreshCcw,
  ShieldCheck,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LLMConfig } from "@/types/llm_config";
import {
  SlideCraftApi,
  SlideCraftGenerateResponse,
  SlideCraftStyle,
} from "@/app/(presentation-generator)/services/api/slidecraft";

type StyleCategory =
  | "全部"
  | "商业汇报"
  | "技术工程"
  | "创意表达"
  | "教学课程"
  | "产品发布";

type StyleOption = {
  value: SlideCraftStyle;
  label: string;
  description: string;
  accent: string;
  bestFor: string;
  category: StyleCategory;
};

type ValidationItem = {
  label: string;
  passed: boolean;
};

type ModelApiForm = {
  url: string;
  apiKey: string;
  model: string;
};

type ModelConfigStatus = "unknown" | "configured" | "missing";

const STYLE_OPTIONS: StyleOption[] = [
  {
    value: "bento-3d-glass",
    label: "高端软件卡片风",
    description: "精致产品演示、指标看板、玻璃质感卡片",
    accent: "from-sky-500 to-cyan-400",
    bestFor: "产品演示",
    category: "商业汇报",
  },
  {
    value: "neo-minimalism",
    label: "新极简温暖",
    description: "克制留白、温暖细节、高级策略叙事",
    accent: "from-stone-700 to-stone-400",
    bestFor: "高管汇报",
    category: "商业汇报",
  },
  {
    value: "blueprint",
    label: "蓝图设计",
    description: "精确网格、技术线稿、系统架构表达",
    accent: "from-blue-700 to-slate-500",
    bestFor: "技术分享",
    category: "技术工程",
  },
  {
    value: "neo-brutalism-3d",
    label: "数字粗野立体风",
    description: "粗犷几何、强对比、立体冲击力",
    accent: "from-orange-500 to-rose-500",
    bestFor: "创意发布",
    category: "创意表达",
  },
  {
    value: "retro-futurism",
    label: "80 年代未来",
    description: "霓虹地平线、复古科技、电影感节奏",
    accent: "from-fuchsia-500 to-amber-400",
    bestFor: "高能演讲",
    category: "创意表达",
  },
  {
    value: "maximalism-typography",
    label: "极繁实验字体",
    description: "大胆排版、密集层次、文化时尚表达",
    accent: "from-red-500 to-zinc-900",
    bestFor: "潮流文化",
    category: "创意表达",
  },
  {
    value: "naive-typography",
    label: "天真手作字体",
    description: "手绘质感、轻松节奏、亲切教学氛围",
    accent: "from-lime-500 to-emerald-400",
    bestFor: "友好科普",
    category: "教学课程",
  },
  {
    value: "memphis",
    label: "孟菲斯派对",
    description: "明快撞色、几何图形、活泼社区感",
    accent: "from-yellow-400 to-pink-500",
    bestFor: "社区故事",
    category: "创意表达",
  },
  {
    value: "editorial-magazine",
    label: "编辑杂志风",
    description: "杂志封面、引文强调、出版级版面",
    accent: "from-neutral-900 to-amber-600",
    bestFor: "报告长文",
    category: "商业汇报",
  },
  {
    value: "cyber-terminal",
    label: "赛博终端",
    description: "暗色命令中心、数据流、状态面板",
    accent: "from-emerald-500 to-zinc-900",
    bestFor: "安全基建",
    category: "技术工程",
  },
  {
    value: "course-workshop",
    label: "课程工作坊",
    description: "课程节奏、练习卡片、检查点与图解",
    accent: "from-teal-500 to-orange-300",
    bestFor: "培训课程",
    category: "教学课程",
  },
  {
    value: "investor-pitch",
    label: "投资人路演风",
    description: "市场机会、产品价值、增长数据、商业模式",
    accent: "from-indigo-600 to-slate-900",
    bestFor: "融资路演",
    category: "商业汇报",
  },
  {
    value: "obsidian-pro",
    label: "黑曜石专业风",
    description: "深色高级界面、克制对比、精准技术图解",
    accent: "from-zinc-950 to-slate-600",
    bestFor: "人工智能与工程",
    category: "技术工程",
  },
  {
    value: "handdrawn-whiteboard",
    label: "手绘白板风",
    description: "手绘线条、草图箭头、轻松解释复杂系统",
    accent: "from-slate-700 to-sky-300",
    bestFor: "教学拆解",
    category: "教学课程",
  },
  {
    value: "apple-keynote",
    label: "苹果发布会风",
    description: "大留白、产品主张、优雅渐变与电影感节奏",
    accent: "from-neutral-800 to-neutral-300",
    bestFor: "产品发布",
    category: "产品发布",
  },
  {
    value: "data-dashboard",
    label: "数据仪表风",
    description: "关键指标层级、图表面板、洞察标注与对比表",
    accent: "from-cyan-600 to-blue-900",
    bestFor: "数据汇报",
    category: "技术工程",
  },
  {
    value: "corporate-blue-gold",
    label: "商务蓝金风",
    description: "海军蓝、象牙白、哑金点缀，董事会级稳重感",
    accent: "from-blue-950 to-amber-500",
    bestFor: "企业汇报",
    category: "商业汇报",
  },
];

const STYLE_CATEGORIES: StyleCategory[] = [
  "全部",
  "商业汇报",
  "技术工程",
  "创意表达",
  "教学课程",
  "产品发布",
];

const DEFAULT_TOPIC =
  "为一个能把产品笔记生成网页幻灯片的人工智能工具，创建一套适合路演的 HTML 幻灯片。";

const GENERATION_STEPS = ["理解内容", "规划结构", "生成页面", "检查 HTML"];

const SlideCraftWorkbench = () => {
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [audience, setAudience] = useState("产品团队和创业者");
  const [language, setLanguage] = useState("中文");
  const [nSlides, setNSlides] = useState(8);
  const [style, setStyle] = useState<SlideCraftStyle>("bento-3d-glass");
  const [styleCategory, setStyleCategory] = useState<StyleCategory>("全部");
  const [instructions, setInstructions] = useState(
    "让视觉风格鲜明，包含从问题到解决方案的叙事，并保证现场演示时每页都清晰易读。"
  );
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(true);
  const [result, setResult] = useState<SlideCraftGenerateResponse | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
  const [isModelConfigOpen, setIsModelConfigOpen] = useState(false);
  const [isSavingModelConfig, setIsSavingModelConfig] = useState(false);
  const [modelConfigStatus, setModelConfigStatus] =
    useState<ModelConfigStatus>("unknown");
  const [modelApiForm, setModelApiForm] = useState<ModelApiForm>({
    url: "",
    apiKey: "",
    model: "",
  });
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    void loadModelConfig();
  }, []);

  const selectedStyle = useMemo(
    () => STYLE_OPTIONS.find((item) => item.value === style) ?? STYLE_OPTIONS[0],
    [style]
  );

  const filteredStyleOptions = useMemo(
    () =>
      STYLE_OPTIONS.filter((item) =>
        styleCategory === "全部" ? true : item.category === styleCategory
      ),
    [styleCategory]
  );

  const validationItems = useMemo(
    () => getValidationItems(result),
    [result]
  );

  const loadModelConfig = async () => {
    try {
      const response = await fetch("/api/user-config", { cache: "no-cache" });
      if (!response.ok) {
        setModelConfigStatus("unknown");
        return;
      }

      const config = (await response.json()) as LLMConfig;
      const nextForm = {
        url: config.CUSTOM_LLM_URL ?? "",
        apiKey: config.CUSTOM_LLM_API_KEY ?? "",
        model: config.CUSTOM_MODEL ?? "",
      };
      setModelApiForm(nextForm);
      setModelConfigStatus(
        config.LLM === "custom" && nextForm.url && nextForm.model
          ? "configured"
          : "missing"
      );
    } catch {
      setModelConfigStatus("unknown");
    }
  };

  const saveModelConfig = async () => {
    const url = modelApiForm.url.trim();
    const model = modelApiForm.model.trim();
    const apiKey = modelApiForm.apiKey.trim();

    if (!url || !model) {
      toast.error("请填写接口地址和模型名。");
      return;
    }

    setIsSavingModelConfig(true);
    try {
      const response = await fetch("/api/user-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          LLM: "custom",
          CUSTOM_LLM_URL: url,
          CUSTOM_LLM_API_KEY: apiKey,
          CUSTOM_MODEL: model,
          DISABLE_IMAGE_GENERATION: true,
        } satisfies LLMConfig),
      });

      if (!response.ok) {
        throw new Error(await readResponseError(response));
      }

      setModelConfigStatus("configured");
      setIsModelConfigOpen(false);
      toast.success("模型 API 已保存。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "模型 API 保存失败。");
    } finally {
      setIsSavingModelConfig(false);
    }
  };

  const generate = async () => {
    if (!topic.trim()) {
      toast.error("请先输入内容简述。");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await SlideCraftApi.generate({
        topic: topic.trim(),
        audience: audience.trim() || null,
        language: language.trim() || null,
        n_slides: nSlides,
        style,
        instructions: instructions.trim() || null,
        include_speaker_notes: includeSpeakerNotes,
      });
      setResult(response);
      setPreviewKey((current) => current + 1);
      setGenerationError(null);
      toast.success("HTML 幻灯片已生成。");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "生成失败，已保留上一次结果。";
      setGenerationError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyHtml = async () => {
    if (!result?.html) return;
    await navigator.clipboard.writeText(result.html);
    toast.success("HTML 已复制。");
  };

  const downloadHtml = () => {
    if (!result?.html) return;
    const blob = new Blob([result.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(result.title)}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const refreshPreview = () => {
    if (!result?.html) return;
    setPreviewKey((current) => current + 1);
    toast.success("预览已刷新。");
  };

  return (
    <main className="min-h-[100dvh] bg-[#F5F2EA] px-4 pb-8 text-[#191714] sm:px-7">
      <header className="mx-auto flex max-w-[1500px] flex-col gap-5 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <img src="/logo-with-bg.png" alt="SlideCraft" className="h-10 w-10" />
            <div>
              <p className="font-syne text-xs font-semibold uppercase tracking-[0.14em] text-[#9A5B14]">
                HTML 网页幻灯片工作台
              </p>
              <h1 className="font-unbounded text-2xl font-normal text-[#191714]">
                SlideCraft 生成器
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6558]">
            输入主题、风格和篇幅，生成可直接打开的 HTML 网页幻灯片，并在右侧实时预览源码与成品。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6F6558]">
          <button
            type="button"
            onClick={() => {
              setIsModelConfigOpen(true);
              void loadModelConfig();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#D8D0C3] bg-white/80 px-3 py-2 transition duration-200 hover:border-[#BCA988] hover:bg-white active:scale-[0.98]"
          >
            <Cpu className="h-3.5 w-3.5" />
            后端模型 API
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                modelConfigStatus === "configured"
                  ? "bg-[#EDF7E7] text-[#416F32]"
                  : "bg-[#FFF1DA] text-[#8F4F11]"
              }`}
            >
              {modelConfigStatus === "configured" ? "已配置" : "未确认"}
            </span>
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D8D0C3] bg-white/70 px-3 py-2">
            <FileText className="h-3.5 w-3.5" />
            单文件 HTML
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
        <section className="rounded-[24px] border border-[#D8D0C3] bg-[#FFFDF8] p-5 shadow-[0_24px_70px_-40px_rgba(67,54,38,0.45)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="font-syne text-sm font-semibold text-[#9A5B14]">
                生成器
              </p>
              <h2 className="mt-2 font-unbounded text-2xl font-normal text-[#191714]">
                浏览器原生幻灯片
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#6F6558]">
                先选类别，再选风格，减少来回滚动，让生成入口更像一个真正的创作面板。
              </p>
            </div>
            <div className="rounded-2xl bg-[#F0E1C8] p-2 text-[#8F4F11]">
              <Wand2 className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">内容简述</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="min-h-[138px] resize-none rounded-2xl border-[#D8D0C3] bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audience">目标受众</Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  className="rounded-2xl border-[#D8D0C3] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">语言</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="rounded-2xl border-[#D8D0C3] bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slide-count">页数</Label>
              <Input
                id="slide-count"
                type="number"
                min={1}
                max={30}
                value={nSlides}
                onChange={(event) =>
                  setNSlides(clampNumber(Number(event.target.value), 1, 30))
                }
                className="rounded-2xl border-[#D8D0C3] bg-white"
              />
            </div>

            <div className="rounded-[22px] border border-[#E6DED1] bg-[#FAF4EA] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#191714]">
                    <Palette className="h-4 w-4 text-[#9A5B14]" />
                    选择视觉风格
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#6F6558]">
                    当前：{selectedStyle.label} · {selectedStyle.bestFor}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#7A4C18]">
                  {filteredStyleOptions.length} / {STYLE_OPTIONS.length}
                </span>
              </div>

              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {STYLE_CATEGORIES.map((category) => {
                  const active = styleCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setStyleCategory(category)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition duration-200 active:scale-[0.98] ${
                        active
                          ? "border-[#9A5B14] bg-[#9A5B14] text-white"
                          : "border-[#D8D0C3] bg-white text-[#6F6558] hover:border-[#C9BDAA] hover:text-[#191714]"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {filteredStyleOptions.map((item, index) => {
                  const isSelected = item.value === style;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStyle(item.value)}
                      className={`group min-h-[132px] w-[240px] shrink-0 rounded-2xl border p-3 text-left transition duration-200 active:scale-[0.99] ${
                        isSelected
                          ? "border-[#9A5B14] bg-[#FFF4DF] shadow-[0_14px_36px_-26px_rgba(116,69,19,0.8)]"
                          : "border-[#E6DED1] bg-white hover:border-[#C9BDAA]"
                      }`}
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span
                          className={`block h-1.5 w-16 rounded-full bg-gradient-to-r ${item.accent}`}
                        />
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9A5B14]" />
                        ) : null}
                      </div>
                      <span className="block text-sm font-semibold text-[#191714]">
                        {item.label}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-[#6F6558]">
                        {item.description}
                      </span>
                      <span className="mt-3 inline-flex rounded-full bg-[#F7F1E7] px-2 py-1 text-[11px] font-medium text-[#7A4C18]">
                        {item.bestFor}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">补充要求</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                className="min-h-[104px] resize-none rounded-2xl border-[#D8D0C3] bg-white"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E6DED1] bg-white px-3 py-3">
              <div>
                <p className="text-sm font-semibold text-[#191714]">演讲备注</p>
                <p className="text-sm text-[#6F6558]">
                  写入隐藏的 notes 区块
                </p>
              </div>
              <Switch
                checked={includeSpeakerNotes}
                onCheckedChange={setIncludeSpeakerNotes}
              />
            </div>

            <Button
              onClick={generate}
              disabled={isGenerating}
              className="h-12 w-full gap-2 rounded-full bg-[#1F2A24] text-white shadow-[0_14px_30px_-18px_rgba(31,42,36,0.65)] hover:bg-[#141C18]"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? "正在生成 HTML..." : "生成 HTML 幻灯片"}
            </Button>
          </div>
        </section>

        <section className="min-h-[720px] overflow-hidden rounded-[24px] border border-[#D8D0C3] bg-[#FFFDF8] shadow-[0_24px_70px_-40px_rgba(67,54,38,0.45)]">
          <div className="flex flex-col gap-3 border-b border-[#E6DED1] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#191714]">
                {result?.title ?? "预览"}
              </p>
              <p className="text-sm text-[#6F6558]">
                {result
                  ? `${selectedStyle.label} - ${result.html.length.toLocaleString()} 个字符`
                  : "生成后的 HTML 会显示在这里"}
              </p>
              {result ? (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#7A7063]">
                  <span className="rounded-full border border-[#E6DED1] bg-[#FAF4EA] px-2.5 py-1">
                    {selectedStyle.bestFor}
                  </span>
                  <span className="rounded-full border border-[#E6DED1] bg-[#FAF4EA] px-2.5 py-1">
                    {result.style}
                  </span>
                  <span className="rounded-full border border-[#E6DED1] bg-[#FAF4EA] px-2.5 py-1">
                    {result.warnings.length} 条提示
                  </span>
                </div>
              ) : null}
            </div>

            <PreviewToolbar
              hasResult={Boolean(result?.html)}
              onCopy={copyHtml}
              onDownload={downloadHtml}
              onRefresh={refreshPreview}
              onFullscreen={() => setIsFullscreenPreviewOpen(true)}
            />
          </div>

          {result?.warnings?.length ? (
            <div className="border-b border-[#E8BC63] bg-[#FFF8E8] px-4 py-3 text-sm text-[#7A4C18]">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{result.warnings.join(" ")}</span>
              </div>
            </div>
          ) : null}

          {generationError ? (
            <div className="border-b border-[#F0B8A6] bg-[#FFF3EF] px-4 py-3 text-sm text-[#8E321D]">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{generationError}</span>
              </div>
            </div>
          ) : null}

          {isGenerating || result?.html ? (
            <ValidationStrip items={validationItems} isGenerating={isGenerating} />
          ) : null}

          <Tabs defaultValue="preview" className="h-[calc(100%-132px)]">
            <TabsList className="mx-4 mt-4 grid w-[260px] grid-cols-2 rounded-full bg-[#F0E8DB] p-1">
              <TabsTrigger value="preview" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:text-[#191714]">
                <Eye className="h-4 w-4" />
                预览
              </TabsTrigger>
              <TabsTrigger value="source" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:text-[#191714]">
                <Code2 className="h-4 w-4" />
                源码
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="m-0 p-4">
              {isGenerating ? (
                <GeneratingPreview />
              ) : result?.html ? (
                <iframe
                  key={previewKey}
                  ref={previewFrameRef}
                  title="SlideCraft preview"
                  sandbox="allow-scripts allow-same-origin"
                  srcDoc={result.html}
                  className="h-[640px] w-full rounded-2xl border border-[#D8D0C3] bg-white shadow-[0_18px_40px_-28px_rgba(67,54,38,0.45)]"
                />
              ) : generationError ? (
                <ErrorPreview
                  message={generationError}
                  onOpenModelConfig={() => {
                    setIsModelConfigOpen(true);
                    void loadModelConfig();
                  }}
                  onRetry={generate}
                />
              ) : (
                <EmptyPreview />
              )}
            </TabsContent>

            <TabsContent value="source" className="m-0 p-4">
              <pre className="h-[640px] overflow-auto rounded-2xl border border-[#2B332D] bg-[#171C18] p-4 text-xs leading-5 text-[#EDE7DB] shadow-[0_18px_40px_-28px_rgba(15,18,16,0.65)]">
                <code>{result?.html ?? "<!-- 生成幻灯片后可在这里查看 HTML 源码。 -->"}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <ModelApiDialog
        form={modelApiForm}
        open={isModelConfigOpen}
        isSaving={isSavingModelConfig}
        onOpenChange={setIsModelConfigOpen}
        onChange={setModelApiForm}
        onSave={saveModelConfig}
      />

      {isFullscreenPreviewOpen && result?.html ? (
        <FullscreenPreview
          html={result.html}
          title={result.title}
          onClose={() => setIsFullscreenPreviewOpen(false)}
        />
      ) : null}
    </main>
  );
};

const PreviewToolbar = ({
  hasResult,
  onCopy,
  onDownload,
  onRefresh,
  onFullscreen,
}: {
  hasResult: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onRefresh: () => void;
  onFullscreen: () => void;
}) => (
  <div className="flex flex-wrap gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={!hasResult}
      className="gap-2 rounded-full border-[#D8D0C3] bg-white/90"
    >
      <RefreshCcw className="h-4 w-4" />
      刷新
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={onFullscreen}
      disabled={!hasResult}
      className="gap-2 rounded-full border-[#D8D0C3] bg-white/90"
    >
      <Maximize2 className="h-4 w-4" />
      全屏
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={onCopy}
      disabled={!hasResult}
      className="gap-2 rounded-full border-[#D8D0C3] bg-white/90"
    >
      <Copy className="h-4 w-4" />
      复制
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={onDownload}
      disabled={!hasResult}
      className="gap-2 rounded-full border-[#D8D0C3] bg-white/90"
    >
      <Download className="h-4 w-4" />
      下载
    </Button>
  </div>
);

const ModelApiDialog = ({
  form,
  open,
  isSaving,
  onOpenChange,
  onChange,
  onSave,
}: {
  form: ModelApiForm;
  open: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (form: ModelApiForm) => void;
  onSave: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="border-[#D8D0C3] bg-[#FFFDF8] sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="font-unbounded text-xl font-normal text-[#191714]">
          后端模型 API
        </DialogTitle>
        <DialogDescription className="text-[#6F6558]">
          填写 OpenAI 兼容接口，生成时会使用这里保存的模型配置。
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="custom-llm-url">接口地址</Label>
          <Input
            id="custom-llm-url"
            value={form.url}
            onChange={(event) =>
              onChange({ ...form, url: event.target.value })
            }
            placeholder="http://64.90.14.72:8317/v1"
            className="rounded-2xl border-[#D8D0C3] bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-llm-key">API Key</Label>
          <Input
            id="custom-llm-key"
            type="password"
            value={form.apiKey}
            onChange={(event) =>
              onChange({ ...form, apiKey: event.target.value })
            }
            placeholder="your-api-key"
            className="rounded-2xl border-[#D8D0C3] bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-llm-model">模型名</Label>
          <Input
            id="custom-llm-model"
            value={form.model}
            onChange={(event) =>
              onChange({ ...form, model: event.target.value })
            }
            placeholder="gpt-5.5"
            className="rounded-2xl border-[#D8D0C3] bg-white"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="rounded-full border-[#D8D0C3] bg-white"
        >
          取消
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="rounded-full bg-[#1F2A24] text-white hover:bg-[#141C18]"
        >
          {isSaving ? "保存中..." : "保存配置"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const ValidationStrip = ({
  items,
  isGenerating,
}: {
  items: ValidationItem[];
  isGenerating: boolean;
}) => (
  <div className="border-b border-[#E6DED1] bg-[#FAF4EA] px-4 py-3">
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#7A4C18]">
      <ShieldCheck className="h-4 w-4" />
      HTML 检查
    </div>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${
            item.passed
              ? "border-[#C9D8BE] bg-[#F2F8EE] text-[#37602A]"
              : "border-[#E6DED1] bg-white text-[#7A7063]"
          }`}
        >
          <CheckCircle2
            className={`h-3.5 w-3.5 ${item.passed ? "text-[#4F7C3A]" : "text-[#B8AA98]"}`}
          />
          {isGenerating ? "检查中：" : ""}
          {item.label}
        </div>
      ))}
    </div>
  </div>
);

const GeneratingPreview = () => (
  <div className="h-[640px] rounded-2xl border border-[#D8D0C3] bg-[#FAF4EA] p-6">
    <div className="flex h-full flex-col justify-between">
      <div>
        <p className="font-unbounded text-2xl text-[#191714]">正在生成预览</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#6F6558]">
          模型正在把内容、风格和网页幻灯片结构合成到一个单文件 HTML 中。
        </p>
      </div>

      <div className="grid gap-3">
        {GENERATION_STEPS.map((step, index) => (
          <div
            key={step}
            className="overflow-hidden rounded-2xl border border-[#E6DED1] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#191714]">{step}</span>
              <span className="text-xs text-[#9A5B14]">0{index + 1}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F0E8DB]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9A5B14] to-[#1F2A24]"
                style={{
                  width: `${35 + index * 16}%`,
                  animation: "slidecraft-pulse 1.6s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const EmptyPreview = () => (
  <div className="flex h-[640px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D8D0C3] bg-[#FAF4EA] text-center">
    <FileText className="mb-4 h-9 w-9 text-[#A58B65]" />
    <p className="text-sm font-semibold text-[#191714]">还没有生成幻灯片</p>
    <p className="mt-1 max-w-sm text-sm text-[#6F6558]">
      选择一个视觉风格，填写内容简述，然后生成可直接打开的单文件 HTML 幻灯片。
    </p>
  </div>
);

const ErrorPreview = ({
  message,
  onOpenModelConfig,
  onRetry,
}: {
  message: string;
  onOpenModelConfig: () => void;
  onRetry: () => void;
}) => (
  <div className="flex h-[640px] flex-col items-center justify-center rounded-2xl border border-[#F0B8A6] bg-[#FFF3EF] p-6 text-center">
    <div className="mb-4 rounded-2xl bg-white p-3 text-[#8E321D] shadow-[0_12px_28px_-24px_rgba(142,50,29,0.8)]">
      <AlertTriangle className="h-6 w-6" />
    </div>
    <p className="text-sm font-semibold text-[#191714]">生成没有完成</p>
    <p className="mt-2 max-w-md text-sm leading-6 text-[#7A4C18]">{message}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <Button
        variant="outline"
        onClick={onOpenModelConfig}
        className="rounded-full border-[#D8D0C3] bg-white"
      >
        配置模型 API
      </Button>
      <Button
        onClick={onRetry}
        className="rounded-full bg-[#1F2A24] text-white hover:bg-[#141C18]"
      >
        重试生成
      </Button>
    </div>
  </div>
);
const FullscreenPreview = ({
  html,
  title,
  onClose,
}: {
  html: string;
  title: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 bg-[#111511] p-3">
    <div className="mb-3 flex items-center justify-between gap-3 text-white">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/60">全屏预览，可在幻灯片内使用方向键试讲</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className="gap-2 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
        关闭
      </Button>
    </div>
    <iframe
      title="SlideCraft fullscreen preview"
      sandbox="allow-scripts allow-same-origin"
      srcDoc={html}
      className="h-[calc(100dvh-64px)] w-full rounded-2xl border border-white/15 bg-white"
    />
  </div>
);

const getValidationItems = (
  result: SlideCraftGenerateResponse | null
): ValidationItem[] => {
  const html = result?.html.toLowerCase() ?? "";
  const warnings = (result?.warnings ?? []).join(" ").toLowerCase();

  return [
    {
      label: "完整 HTML 文档",
      passed: Boolean(html.includes("<!doctype html") && html.includes("<html")),
    },
    {
      label: "包含幻灯片结构",
      passed: Boolean(html.includes("<section") && html.includes("class=\"slide")),
    },
    {
      label: "包含键盘翻页",
      passed: Boolean(html.includes("slidepresentation") || html.includes("keydown")),
    },
    {
      label: "无明显外链脚本",
      passed: Boolean(result?.html && !warnings.includes("external script") && !html.includes("<script src=")),
    },
  ];
};

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const slugify = (value: string) => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "slidecraft-deck";
};

const readResponseError = async (response: Response) => {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string") return payload.detail;
    if (typeof payload?.error === "string") return payload.error;
  } catch {
    return response.statusText;
  }

  return response.statusText;
};

export default SlideCraftWorkbench;

