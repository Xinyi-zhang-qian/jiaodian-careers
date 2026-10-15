export const roboticsDirectionDefinitions = [
  {
    id: 'simulation',
    name: '仿真与合成数据',
    color: '#0f766e',
    keywords: ['仿真', '物理引擎', '合成数据', 'sim2real', 'isaac', 'mujoco', 'gazebo', '数字孪生', '图形算法', '重建'],
  },
  {
    id: 'vla',
    name: 'VLA / 具身大模型',
    color: '#db2777',
    keywords: ['vla', 'wam', '具身大模型', '多模态大模型', '世界模型', '世界动作模型', '智能体', 'agent', '大模型'],
  },
  {
    id: 'planning-control',
    name: '规划控制与操作',
    color: '#2563eb',
    keywords: ['运动控制', '全身控制', '规划', '控制算法', '强化学习', '模仿学习', '灵巧', '抓取', '操作算法', '力控', 'wbc', 'mpc', '轨迹'],
  },
  {
    id: 'perception',
    name: '感知、视觉与 SLAM',
    color: '#d97706',
    keywords: ['视觉', '感知', 'slam', 'vio', '点云', '定位', '建图', '3d', '三维', '触觉'],
  },
  {
    id: 'data-evaluation',
    name: '数据、评测与测试',
    color: '#64748b',
    keywords: ['数据', '评测', '评价', '测试', '标注', '清洗', 'benchmark', '质量评估', '部署'],
  },
  {
    id: 'system-hardware',
    name: '本体、系统与硬件',
    color: '#7c3aed',
    keywords: ['本体', '系统工程', '系统集成', '硬件', '嵌入式', '结构', '驱动', '电机', '中间件', 'ros', '基础软件'],
  },
] as const;

export type RoboticsDirectionId = (typeof roboticsDirectionDefinitions)[number]['id'];
export type RoboticsRecruitmentType = '校招' | '社招' | '博士后';
export type RoboticsSourceType = '企业官网' | '高校/研究机构' | '招聘平台';

export interface RoboticsPlatformSearch {
  platform: 'BOSS直聘' | '猎聘';
  query: string;
  sourceUrl: string;
  includedJobs: number;
  note: string;
}

export interface NormalizedSalary {
  kind: 'monthly' | 'daily' | 'undisclosed';
  min: number | null;
  max: number | null;
  unit: 'K/月' | '元/天' | null;
  months: number | null;
}

export interface RoboticsMarketJob {
  id: string;
  title: string;
  organization: string;
  city: string;
  location: string;
  direction: RoboticsDirectionId;
  recruitmentType: RoboticsRecruitmentType;
  salary: string;
  normalizedSalary: NormalizedSalary;
  education: string;
  experience: string;
  requirements: string;
  skills: string[];
  summary: string;
  sourceName: string;
  sourceType: RoboticsSourceType;
  sourceUrl: string;
  capturedAt: string;
  verifiedAt: string;
  sourceStatus: '可访问' | '受限或需复核';
  httpStatus: number | null;
}

export interface RoboticsMarketDataset {
  generatedAt: string;
  scope: string;
  methodology: string[];
  platformSearches: RoboticsPlatformSearch[];
  jobs: RoboticsMarketJob[];
}

const titleRules: Array<{ id: RoboticsDirectionId; pattern: RegExp }> = [
  { id: 'simulation', pattern: /仿真|物理引擎|合成数据|图形算法|重建/i },
  { id: 'data-evaluation', pattern: /数据|评测|评价|测试|标注/i },
  { id: 'system-hardware', pattern: /硬件|系统工程|系统集成|本体|嵌入式|基础软件/i },
  { id: 'perception', pattern: /视觉|感知|SLAM|VIO|点云|定位|建图|触觉/i },
  { id: 'planning-control', pattern: /运动控制|全身控制|控制算法|规划|灵巧|抓取|操作算法|强化学习|力控/i },
  { id: 'vla', pattern: /VLA|WAM|具身大模型|多模态|世界模型|智能体|Agent|大模型|具身算法/i },
];

export function classifyRoboticsDirection(title: string, detail: string): RoboticsDirectionId {
  const titleMatch = titleRules.find((rule) => rule.pattern.test(title));
  if (titleMatch) return titleMatch.id;

  const haystack = `${title} ${detail}`.toLowerCase();
  let best: RoboticsDirectionId = 'system-hardware';
  let bestScore = -1;

  for (const definition of roboticsDirectionDefinitions) {
    const score = definition.keywords.reduce((total, keyword) => (
      total + (haystack.includes(keyword.toLowerCase()) ? 1 : 0)
    ), 0);
    if (score > bestScore) {
      best = definition.id;
      bestScore = score;
    }
  }

  return best;
}

export function normalizeSalary(rawSalary: string | null | undefined): NormalizedSalary {
  const salary = (rawSalary ?? '').trim();
  if (!salary || /面议|确认为准|未公开/.test(salary)) {
    return { kind: 'undisclosed', min: null, max: null, unit: null, months: null };
  }

  const daily = salary.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*元\s*\/\s*天/i);
  if (daily) {
    return { kind: 'daily', min: Number(daily[1]), max: Number(daily[2]), unit: '元/天', months: null };
  }

  const monthlyK = salary.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*[kK]/);
  if (monthlyK) {
    const months = salary.match(/[·x×]\s*(\d+)\s*薪/i);
    return {
      kind: 'monthly',
      min: Number(monthlyK[1]),
      max: Number(monthlyK[2]),
      unit: 'K/月',
      months: months ? Number(months[1]) : null,
    };
  }

  const monthlyYuan = salary.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*元\s*\/\s*月/i);
  if (monthlyYuan) {
    return {
      kind: 'monthly',
      min: Number(monthlyYuan[1]) / 1000,
      max: Number(monthlyYuan[2]) / 1000,
      unit: 'K/月',
      months: null,
    };
  }

  return { kind: 'undisclosed', min: null, max: null, unit: null, months: null };
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(1))
    : sorted[middle];
}

function countBy(items: string[]) {
  return [...items.reduce((map, item) => map.set(item, (map.get(item) ?? 0) + 1), new Map<string, number>())]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function analyzeRoboticsMarket(jobs: RoboticsMarketJob[]) {
  const organizations = new Set(jobs.map((job) => job.organization));
  const cities = new Set(jobs.map((job) => job.city));
  const disclosed = jobs.filter((job) => job.normalizedSalary.kind !== 'undisclosed');

  const directions = roboticsDirectionDefinitions.map((definition) => {
    const matching = jobs.filter((job) => job.direction === definition.id);
    const monthlyMidpoints = matching
      .filter((job) => job.normalizedSalary.kind === 'monthly')
      .map((job) => ((job.normalizedSalary.min ?? 0) + (job.normalizedSalary.max ?? 0)) / 2);
    return {
      ...definition,
      count: matching.length,
      share: jobs.length ? Number(((matching.length / jobs.length) * 100).toFixed(1)) : 0,
      salaryDisclosed: matching.filter((job) => job.normalizedSalary.kind !== 'undisclosed').length,
      monthlySalarySamples: monthlyMidpoints.length,
      monthlyMedianK: median(monthlyMidpoints),
    };
  }).sort((a, b) => b.count - a.count);

  const skills = countBy(jobs.flatMap((job) => job.skills.map((skill) => skill.trim()).filter(Boolean))).slice(0, 15);

  return {
    total: jobs.length,
    organizationCount: organizations.size,
    cityCount: cities.size,
    salaryDisclosureRate: jobs.length ? Number(((disclosed.length / jobs.length) * 100).toFixed(1)) : 0,
    directions,
    cities: countBy(jobs.map((job) => job.city)).slice(0, 12),
    organizations: countBy(jobs.map((job) => job.organization)).slice(0, 12),
    recruitmentTypes: countBy(jobs.map((job) => job.recruitmentType)),
    sourceTypes: countBy(jobs.map((job) => job.sourceType)),
    skills,
  };
}
