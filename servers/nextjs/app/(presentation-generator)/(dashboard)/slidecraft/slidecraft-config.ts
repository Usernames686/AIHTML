import { SlideCraftStyle } from "@/app/(presentation-generator)/services/api/slidecraft";

export type StyleCategory =
  | "全部"
  | "商业汇报"
  | "技术工程"
  | "创意表达"
  | "教学课程"
  | "产品发布";

export type StyleOption = {
  value: SlideCraftStyle;
  label: string;
  description: string;
  accent: string;
  bestFor: string;
  category: StyleCategory;
};

export type ValidationItem = {
  label: string;
  passed: boolean;
};

export type ModelApiForm = {
  url: string;
  apiKey: string;
  model: string;
};

export type ModelConfigStatus = "unknown" | "configured" | "missing";

export const STYLE_OPTIONS: StyleOption[] = [
  { value: "bento-3d-glass", label: "高端软件卡片风", description: "精致产品演示、指标看板、玻璃质感卡片", accent: "from-sky-500 to-cyan-400", bestFor: "产品演示", category: "商业汇报" },
  { value: "neo-minimalism", label: "新极简温暖", description: "克制留白、温暖细节、高级策略叙事", accent: "from-stone-700 to-stone-400", bestFor: "高管汇报", category: "商业汇报" },
  { value: "blueprint", label: "蓝图设计", description: "精确网格、技术线稿、系统架构表达", accent: "from-blue-700 to-slate-500", bestFor: "技术分享", category: "技术工程" },
  { value: "neo-brutalism-3d", label: "数字粗野立体风", description: "粗犷几何、强对比、立体冲击力", accent: "from-orange-500 to-rose-500", bestFor: "创意发布", category: "创意表达" },
  { value: "retro-futurism", label: "80 年代未来", description: "霓虹地平线、复古科技、电影感节奏", accent: "from-fuchsia-500 to-amber-400", bestFor: "高能演讲", category: "创意表达" },
  { value: "maximalism-typography", label: "极繁实验字体", description: "大胆排版、密集层次、文化时尚表达", accent: "from-red-500 to-zinc-900", bestFor: "潮流文化", category: "创意表达" },
  { value: "naive-typography", label: "天真手作字体", description: "手绘质感、轻松节奏、亲切教学氛围", accent: "from-lime-500 to-emerald-400", bestFor: "友好科普", category: "教学课程" },
  { value: "memphis", label: "孟菲斯派对", description: "明快撞色、几何图形、活泼社区感", accent: "from-yellow-400 to-pink-500", bestFor: "社区故事", category: "创意表达" },
  { value: "editorial-magazine", label: "编辑杂志风", description: "杂志封面、引文强调、出版级版面", accent: "from-neutral-900 to-amber-600", bestFor: "报告长文", category: "商业汇报" },
  { value: "cyber-terminal", label: "赛博终端", description: "暗色命令中心、数据流、状态面板", accent: "from-emerald-500 to-zinc-900", bestFor: "安全基建", category: "技术工程" },
  { value: "course-workshop", label: "课程工作坊", description: "课程节奏、练习卡片、检查点与图解", accent: "from-teal-500 to-orange-300", bestFor: "培训课程", category: "教学课程" },
  { value: "investor-pitch", label: "投资人路演风", description: "市场机会、产品价值、增长数据、商业模式", accent: "from-indigo-600 to-slate-900", bestFor: "融资路演", category: "商业汇报" },
  { value: "obsidian-pro", label: "黑曜石专业风", description: "深色高级界面、克制对比、精准技术图解", accent: "from-zinc-950 to-slate-600", bestFor: "人工智能与工程", category: "技术工程" },
  { value: "handdrawn-whiteboard", label: "手绘白板风", description: "手绘线条、草图箭头、轻松解释复杂系统", accent: "from-slate-700 to-sky-300", bestFor: "教学拆解", category: "教学课程" },
  { value: "apple-keynote", label: "苹果发布会风", description: "大留白、产品主张、优雅渐变与电影感节奏", accent: "from-neutral-800 to-neutral-300", bestFor: "产品发布", category: "产品发布" },
  { value: "data-dashboard", label: "数据仪表风", description: "关键指标层级、图表面板、洞察标注与对比表", accent: "from-cyan-600 to-blue-900", bestFor: "数据汇报", category: "技术工程" },
  { value: "corporate-blue-gold", label: "商务蓝金风", description: "海军蓝、象牙白、哑金点缀，董事会级稳重感", accent: "from-blue-950 to-amber-500", bestFor: "企业汇报", category: "商业汇报" },
];

export const STYLE_CATEGORIES: StyleCategory[] = ["全部", "商业汇报", "技术工程", "创意表达", "教学课程", "产品发布"];

export const DEFAULT_TOPIC = "为一个能把产品笔记生成网页幻灯片的人工智能工具，创建一套适合路演的 HTML 幻灯片。";
export const GENERATION_STEPS = ["理解内容", "规划结构", "生成页面", "检查 HTML"];
export const TOPIC_STARTERS = ["产品发布", "融资路演", "技术分享"] as const;
export const TOPIC_STARTER_CONTENT: Record<(typeof TOPIC_STARTERS)[number], string> = {
  产品发布: "为一款全新的人工智能产品创建发布会演示，讲清用户痛点、核心能力、使用场景和产品愿景。",
  融资路演: "创建一套面向投资人的创业项目路演，包含市场机会、产品方案、商业模式、增长数据和融资计划。",
  技术分享: "创建一套面向工程团队的技术分享，解释背景问题、系统架构、关键实现、实践结果和后续规划。",
};
