import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Maximize2,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GENERATION_STEPS, ModelApiForm, ValidationItem } from "./slidecraft-config";

export const PreviewToolbar = ({
  onCopy,
  onDownload,
  onRefresh,
  onFullscreen,
}: {
  onCopy: () => void;
  onDownload: () => void;
  onRefresh: () => void;
  onFullscreen: () => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    <Button variant="ghost" size="sm" onClick={onRefresh} className="stage-tool"><RefreshCcw className="h-4 w-4" />刷新</Button>
    <Button variant="ghost" size="sm" onClick={onFullscreen} className="stage-tool"><Maximize2 className="h-4 w-4" />全屏</Button>
    <Button variant="ghost" size="sm" onClick={onCopy} className="stage-tool"><Copy className="h-4 w-4" />复制</Button>
    <Button variant="ghost" size="sm" onClick={onDownload} className="stage-tool"><Download className="h-4 w-4" />下载</Button>
  </div>
);

export const ModelApiDialog = ({
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
  open ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="relative grid w-full max-w-xl gap-5 rounded-xl border border-[#D8D0C3] bg-[#FFFDF8] p-6 text-[#191714] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slidecraft-model-api-title"
      >
        <button
          type="button"
          aria-label="关闭模型 API 配置"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-md p-1 text-[#6F6558] transition hover:bg-[#F0E9DE] hover:text-[#191714]"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-1 pr-8">
          <h2 id="slidecraft-model-api-title" className="font-unbounded text-xl font-normal">后端模型 API</h2>
          <p className="text-sm text-[#6F6558]">填写 OpenAI 兼容接口，生成时会使用这里保存的模型配置。</p>
        </div>
        <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="custom-llm-url">接口地址</Label>
          <Input id="custom-llm-url" value={form.url} onChange={(event) => onChange({ ...form, url: event.target.value })} placeholder="http://64.90.14.72:8317/v1" className="rounded-2xl border-[#D8D0C3] bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-llm-key">API Key</Label>
          <Input id="custom-llm-key" type="password" value={form.apiKey} onChange={(event) => onChange({ ...form, apiKey: event.target.value })} placeholder="your-api-key" className="rounded-2xl border-[#D8D0C3] bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-llm-model">模型名</Label>
          <Input id="custom-llm-model" value={form.model} onChange={(event) => onChange({ ...form, model: event.target.value })} placeholder="gpt-5.5" className="rounded-2xl border-[#D8D0C3] bg-white" />
        </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-[#D8D0C3] bg-white">取消</Button>
          <Button onClick={onSave} disabled={isSaving} className="rounded-full bg-[#1F2A24] text-white hover:bg-[#141C18]">{isSaving ? "保存中..." : "保存配置"}</Button>
        </div>
      </div>
    </div>
  ) : null
);

export const ValidationStrip = ({ items, isGenerating }: { items: ValidationItem[]; isGenerating: boolean }) => (
  <div className="border-b border-[#E6DED1] bg-[#FAF4EA] px-4 py-3">
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#7A4C18]"><ShieldCheck className="h-4 w-4" />HTML 检查</div>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${item.passed ? "border-[#C9D8BE] bg-[#F2F8EE] text-[#37602A]" : "border-[#E6DED1] bg-white text-[#7A7063]"}`}>
          <CheckCircle2 className={`h-3.5 w-3.5 ${item.passed ? "text-[#4F7C3A]" : "text-[#B8AA98]"}`} />
          {isGenerating ? "检查中：" : ""}{item.label}
        </div>
      ))}
    </div>
  </div>
);

export const GeneratingPreview = () => (
  <div className="stage-placeholder p-6">
    <div className="flex h-full flex-col justify-between">
      <div><p className="text-lg font-semibold text-[#27313d]">正在生成预览</p><p className="mt-2 max-w-md text-sm leading-6 text-[#74808e]">模型正在把内容、风格和网页幻灯片结构合成到一个单文件 HTML 中。</p></div>
      <div className="grid gap-3">
        {GENERATION_STEPS.map((step, index) => (
          <div key={step} className="overflow-hidden rounded-2xl border border-[#E6DED1] bg-white p-4">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#191714]">{step}</span><span className="text-xs text-[#9A5B14]">0{index + 1}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F0E8DB]"><div className="h-full rounded-full bg-gradient-to-r from-[#9A5B14] to-[#1F2A24]" style={{ width: `${35 + index * 16}%`, animation: "slidecraft-pulse 1.6s ease-in-out infinite" }} /></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const EmptyPreview = () => (
  <div className="stage-placeholder">
    <div className="sc-ghost-slide">
      <div className="sc-ghost-topline"><span>SLIDECRAFT / DRAFT</span><span>01</span></div>
      <div className="sc-ghost-copy"><span className="sc-ghost-kicker">YOUR STORY STARTS HERE</span><strong>把一个想法，<br />变成值得讲述的画面。</strong><p>选择左侧的内容与视觉方向，生成后可直接在浏览器中演示。</p></div>
      <div className="sc-ghost-shape"><span /><i /></div>
      <div className="sc-ghost-footer"><span>HTML PRESENTATION</span><span>→</span></div>
    </div>
    <div className="sc-preview-hint"><span className="empty-reticle"><FileText className="h-4 w-4" /></span>模板预览 · 等待生成</div>
  </div>
);

export const ErrorPreview = ({ message, onOpenModelConfig, onRetry }: { message: string; onOpenModelConfig: () => void; onRetry: () => void }) => (
  <div className="flex h-[640px] flex-col items-center justify-center rounded-2xl border border-[#F0B8A6] bg-[#FFF3EF] p-6 text-center">
    <div className="mb-4 rounded-2xl bg-white p-3 text-[#8E321D]"><AlertTriangle className="h-6 w-6" /></div>
    <p className="text-sm font-semibold text-[#191714]">生成没有完成</p>
    <p className="mt-2 max-w-md text-sm leading-6 text-[#7A4C18]">{message}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={onOpenModelConfig} className="rounded-full border-[#D8D0C3] bg-white">配置模型 API</Button><Button onClick={onRetry} className="rounded-full bg-[#1F2A24] text-white hover:bg-[#141C18]">重试生成</Button></div>
  </div>
);

export const FullscreenPreview = ({ html, title, onClose }: { html: string; title: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-[#111511] p-3">
    <div className="mb-3 flex items-center justify-between gap-3 text-white">
      <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-white/60">全屏预览，可在幻灯片内使用方向键试讲</p></div>
      <Button variant="outline" size="sm" onClick={onClose} className="gap-2 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"><X className="h-4 w-4" />关闭</Button>
    </div>
    <iframe title="SlideCraft fullscreen preview" sandbox="allow-scripts allow-same-origin" srcDoc={html} className="h-[calc(100dvh-64px)] w-full rounded-2xl border border-white/15 bg-white" />
  </div>
);
