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
  LayoutTemplate,
  Minus,
  Maximize2,
  Palette,
  Presentation,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  DEFAULT_TOPIC,
  GENERATION_STEPS,
  ModelApiForm,
  ModelConfigStatus,
  STYLE_CATEGORIES,
  STYLE_OPTIONS,
  StyleCategory,
  TOPIC_STARTER_CONTENT,
  TOPIC_STARTERS,
  ValidationItem,
} from "./slidecraft-config";
import {
  clampNumber,
  getValidationItems,
  readResponseError,
  slugify,
} from "./slidecraft-utils";
import {
  EmptyPreview,
  ErrorPreview,
  FullscreenPreview,
  GeneratingPreview,
  ModelApiDialog,
  PreviewToolbar,
  ValidationStrip,
} from "./SlideCraftSupport";

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
    <main className="sc-app min-h-[100dvh]">
      <header className="sc-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo-with-bg.png" alt="SlideCraft" className="h-8 w-8 rounded-md" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold">SlideCraft</h1>
            <p className="truncate text-[10px]">PRESENTATION STUDIO</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs text-[#7b8490] sm:inline-flex">
            <FileText className="h-3.5 w-3.5" /> 单文件 HTML
          </span>
          <button
            type="button"
            onClick={() => { setIsModelConfigOpen(true); void loadModelConfig(); }}
            className="sc-config-button"
          >
            <span className={`sc-status-dot ${modelConfigStatus === "configured" ? "is-online" : ""}`} />
            <Cpu className="h-4 w-4" />
            <span className="hidden sm:inline">模型 API</span>
          </button>
        </div>
      </header>

      <div className="sc-workspace">
        <aside className="sc-studio-rail" aria-label="创作流程">
          <div className="is-active"><span>01</span><FileText /><small>内容</small></div>
          <i />
          <div><span>02</span><Palette /><small>风格</small></div>
          <i />
          <div><span>03</span><Presentation /><small>成片</small></div>
        </aside>
        <section className="sc-settings-panel">
          <div className="sc-panel-title">
            <div><Wand2 className="h-4 w-4" /><strong>创作简报</strong></div>
            <span>{topic.length} 字</span>
          </div>
          <div className="sc-form">
            <div className="space-y-2">
              <Label htmlFor="topic" className="sc-label">内容简述 <span>必填</span></Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="sc-textarea min-h-[132px] resize-none"
              />
              <p className="sc-field-help">说明主题、核心观点或粘贴已有内容。</p>
              <div className="sc-starters">
                <span>快速开始</span>
                {TOPIC_STARTERS.map((starter) => (
                  <button key={starter} type="button" onClick={() => setTopic(TOPIC_STARTER_CONTENT[starter])}>
                    {starter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audience" className="sc-label">目标受众</Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  className="sc-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language" className="sc-label">语言</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="sc-input"
                />
              </div>
            </div>

            <div className="sc-count-row">
              <div><Label className="sc-label">幻灯片页数</Label><p>建议 6-12 页</p></div>
              <div className="sc-stepper">
                <button type="button" aria-label="减少页数" onClick={() => setNSlides(clampNumber(nSlides - 1, 1, 30))}><Minus /></button>
                <strong>{nSlides}</strong>
                <button type="button" aria-label="增加页数" onClick={() => setNSlides(clampNumber(nSlides + 1, 1, 30))}><Plus /></button>
              </div>
            </div>

            <div className="sc-style-section">
              <div className="sc-section-heading">
                <div><Palette className="h-4 w-4" /><Label className="sc-label">视觉风格</Label></div>
                <span>{filteredStyleOptions.length} 种风格</span>
              </div>
              <div className="sc-categories hide-scrollbar">
                {STYLE_CATEGORIES.map((category) => {
                  const active = styleCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setStyleCategory(category)}
                      className={active ? "is-active" : ""}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="sc-style-grid hide-scrollbar">
                {filteredStyleOptions.map((item) => {
                  const isSelected = item.value === style;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStyle(item.value)}
                      className={`sc-style-option ${isSelected ? "is-selected" : ""}`}
                    >
                      <span className={`sc-style-swatch bg-gradient-to-br ${item.accent}`}>
                        <i /><b>{item.label.slice(0, 4)}</b><em />
                      </span>
                      <span className="min-w-0 flex-1"><strong>{item.label}</strong><small>{item.bestFor}</small></span>
                      {isSelected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5b5bd6]" /> : null}
                    </button>
                  );
                })}
              </div>
              <div className="sc-selected-style">
                <span className={`bg-gradient-to-br ${selectedStyle.accent}`} />
                <div><strong>{selectedStyle.label}</strong><p>{selectedStyle.description}</p></div>
                <small>{selectedStyle.bestFor}</small>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions" className="sc-label">补充要求</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                className="sc-textarea min-h-[92px] resize-none"
              />
            </div>

            <div className="sc-switch-row">
              <div>
                <p className="text-sm font-semibold text-[#27313d]">包含演讲备注</p>
                <p className="text-xs text-[#7b8490]">
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
              className="sc-generate-button h-12 w-full gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? "正在生成 HTML..." : "生成 HTML 幻灯片"}
            </Button>
          </div>
        </section>

        <section className="sc-preview-panel">
          <div className="sc-preview-header">
            <div>
              <span className="sc-canvas-label"><LayoutTemplate className="h-3.5 w-3.5" /> LIVE CANVAS</span>
              <p className="text-sm font-semibold text-[#27313d]">
                {result?.title ?? "预览"}
              </p>
              <p className="mt-0.5 text-xs text-[#7b8490]">
                {result
                  ? `${selectedStyle.label} - ${result.html.length.toLocaleString()} 个字符`
                  : "生成后的 HTML 会显示在这里"}
              </p>
              {result ? (
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#697483]">
                  <span>
                    {selectedStyle.bestFor}
                  </span>
                  <span>
                    {result.style}
                  </span>
                  <span>
                    {result.warnings.length} 条提示
                  </span>
                </div>
              ) : null}
            </div>

            {result?.html ? (
              <PreviewToolbar
                onCopy={copyHtml}
                onDownload={downloadHtml}
                onRefresh={refreshPreview}
                onFullscreen={() => setIsFullscreenPreviewOpen(true)}
              />
            ) : (
              <span className="sc-not-generated">尚未生成</span>
            )}
          </div>

          {result?.warnings?.length ? (
            <div className="border-b border-[#7b5d21] bg-[#342b18] px-4 py-3 text-sm text-[#f2c56d]">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{result.warnings.join(" ")}</span>
              </div>
            </div>
          ) : null}

          {generationError ? (
            <div className="border-b border-[#7f392d] bg-[#351c18] px-4 py-3 text-sm text-[#ff927d]">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{generationError}</span>
              </div>
            </div>
          ) : null}

          {isGenerating || result?.html ? (
            <ValidationStrip items={validationItems} isGenerating={isGenerating} />
          ) : null}

          <Tabs defaultValue="preview" className="sc-preview-tabs">
            <TabsList className="sc-tab-list">
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                预览
              </TabsTrigger>
              <TabsTrigger value="source" className="gap-2">
                <Code2 className="h-4 w-4" />
                源码
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="sc-preview-content">
              <div className="sc-canvas-workarea">
                <aside className="sc-slide-strip" aria-label="幻灯片页面">
                  <button type="button" className="is-active"><span>1</span><i className={`bg-gradient-to-br ${selectedStyle.accent}`}><b>IDEA</b></i></button>
                  <button type="button"><span>2</span><i><b>STORY</b></i></button>
                  <button type="button"><span>3</span><i><b>PROOF</b></i></button>
                  <button type="button"><span>4</span><i><b>END</b></i></button>
                  <small>+ {Math.max(nSlides - 4, 0)}</small>
                </aside>
                <div className="sc-canvas-center">
                  {isGenerating ? (
                    <GeneratingPreview />
                  ) : result?.html ? (
                    <iframe
                      key={previewKey}
                      ref={previewFrameRef}
                      title="SlideCraft preview"
                      sandbox="allow-scripts allow-same-origin"
                      srcDoc={result.html}
                      className="sc-preview-frame"
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
                  <div className="sc-canvas-meta"><span>16:9</span><span>{nSlides} PAGES</span><span>{language}</span></div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="source" className="sc-preview-content">
              <pre className="sc-source-view">
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

export default SlideCraftWorkbench;
