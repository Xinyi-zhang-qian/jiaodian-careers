import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import realJobs from '../src/data/real-jobs';
import { internshipListings } from '../src/data/internship-listings';
import {
  classifyRoboticsDirection,
  normalizeSalary,
  roboticsDirectionDefinitions,
  type RoboticsMarketDataset,
  type RoboticsMarketJob,
  type RoboticsRecruitmentType,
  type RoboticsSourceType,
} from '../src/lib/robotics-market';

const today = new Date().toISOString().slice(0, 10);
const offline = process.argv.includes('--offline');
const taggedJobIds = new Set([204, 205, 206, 207, 208, 209, 210, 211, 444]);
const excludedInternshipIds = new Set(['xinzhu-plasma-simulation']);

type Seed = Omit<RoboticsMarketJob, 'direction' | 'normalizedSalary' | 'verifiedAt' | 'sourceStatus' | 'httpStatus'>;
type SourceCheck = Pick<RoboticsMarketJob, 'sourceStatus' | 'httpStatus'>;

const extraPublicJobs: Seed[] = [
  {
    id: 'platform-tianchuang-vla', title: 'VLA 研发工程师', organization: '天创机器人',
    city: '南京', location: '南京', recruitmentType: '社招', salary: '14–28K·14薪',
    education: '本科', experience: '经验不限',
    requirements: '研究和优化工业场景机器人 VLA 模型架构，将算法成果部署到机器人产品。',
    skills: ['VLA', '机器人部署', '深度学习'], summary: '面向工业场景研发并部署机器人 VLA 模型。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://www.zhipin.com/zhaopin/4be9443b06ab66150XJ609W5/', capturedAt: today,
  },
  {
    id: 'platform-tianchuang-control', title: '四足机器人控制算法工程师', organization: '天创机器人',
    city: '广州', location: '广州·白云', recruitmentType: '社招', salary: '18–30K·14薪',
    education: '硕士', experience: '经验不限',
    requirements: '完成高保真仿真、强化学习策略训练、Sim2Real 迁移和真机部署闭环。',
    skills: ['强化学习', '运动控制', 'Sim2Real', '真机部署'], summary: '负责四足与轮足机器人强化学习运动控制。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://www.zhipin.com/zhaopin/4be9443b06ab66150XJ609W5/', capturedAt: today,
  },
  {
    id: 'platform-futianlong-simulation', title: '机器人仿真工程师', organization: '富天龙科技有限公司',
    city: '深圳', location: '深圳·南山', recruitmentType: '社招', salary: '30–50K',
    education: '本科', experience: '经验不限',
    requirements: '搭建机器人操作任务仿真环境，支撑 VLA 决策模型与世界模型训练、评估和验证。',
    skills: ['机器人仿真', 'VLA', '世界模型', '任务环境'], summary: '面向 VLA 与世界模型建设机器人仿真环境。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://www.zhipin.com/zhaopin/e0ca58b35b3cff0d1nx909y9/', capturedAt: today,
  },
  {
    id: 'platform-ruiwei-simulation', title: '机器人仿真工程师', organization: '瑞为技术',
    city: '长春', location: '长春·高新区', recruitmentType: '社招', salary: '5–8K',
    education: '大专', experience: '3–5年',
    requirements: '开展焊装生产线机器人模拟仿真，使用 PDPS、ROBCAD、DELMIA、CATIA 等工具。',
    skills: ['工业机器人仿真', 'DELMIA', 'PDPS', 'CATIA'], summary: '面向汽车焊装产线开展工业机器人仿真。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://www.zhipin.com/zhaopin/e0ca58b35b3cff0d1nx909y9/', capturedAt: today,
  },
  {
    id: 'platform-languang-simulation', title: '机器人仿真工程师', organization: '岚光科技',
    city: '长春', location: '长春·绿园', recruitmentType: '社招', salary: '6–7K',
    education: '大专', experience: '1–3年',
    requirements: '建立机器人系统运动学、动力学仿真环境，配合控制算法测试与迭代。',
    skills: ['机器人仿真', '运动学', '动力学', '控制测试'], summary: '建设机器人系统仿真模型并支持控制策略验证。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://www.zhipin.com/zhaopin/e0ca58b35b3cff0d1nx909y9/', capturedAt: today,
  },
  {
    id: 'platform-tplink-robot-slam', title: '机器人算法工程师（SLAM）', organization: 'TP-LINK',
    city: '杭州', location: '杭州·滨江', recruitmentType: '社招', salary: '30–50K·16薪',
    education: '硕士', experience: '1–3年',
    requirements: '研发并优化 2D / 3D 激光雷达 SLAM，提升复杂场景中的建图与定位精度。',
    skills: ['SLAM', '激光雷达', '点云', '定位建图'], summary: '负责机器人激光雷达 SLAM 算法开发与优化。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://m.zhipin.com/zhaopin/c43db07a1b5bf70303Zz29y4/', capturedAt: today,
  },
  {
    id: 'platform-lingxin-slam-vio', title: 'SLAM / VIO 算法工程师', organization: '灵心巧手',
    city: '北京', location: '北京·海淀', recruitmentType: '社招', salary: '20–40K',
    education: '硕士', experience: '1–3年',
    requirements: '开发、调试和优化机器人 SLAM 与 VIO 算法，搭建精度、实时性和鲁棒性测试平台。',
    skills: ['SLAM', 'VIO', '多传感器融合', '算法测试'], summary: '面向机器人定位建图研发 SLAM / VIO 算法。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://www.zhipin.com/zhaopin/01dcaba1dc096db61XV82928/', capturedAt: today,
  },
  {
    id: 'platform-woan-mobile-slam', title: 'SLAM 算法工程师（移动机器人）', organization: '卧安机器人',
    city: '深圳', location: '深圳·宝安', recruitmentType: '社招', salary: '30–50K·13薪',
    education: '本科', experience: '经验不限',
    requirements: '研发轮式、四足与双足移动机器人的底盘 SLAM、导航和多传感器融合算法。',
    skills: ['SLAM', '移动机器人', '导航', '多传感器融合'], summary: '负责移动机器人定位、建图与导航算法。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://www.zhipin.com/zhaopin/197659aa2c7730131X1y0tq0Fg~~/', capturedAt: today,
  },
  {
    id: 'platform-lanjian-slam', title: 'SLAM 算法工程师', organization: '兰剑',
    city: '济南', location: '济南·历城', recruitmentType: '社招', salary: '15–25K·13薪',
    education: '本科', experience: '3–5年',
    requirements: '具备机器人方向经验和激光 SLAM 研发经验，掌握定位、建图和多传感器融合。',
    skills: ['激光 SLAM', '定位建图', '多传感器融合', '机器人导航'], summary: '面向移动机器人研发激光 SLAM 与定位算法。',
    sourceName: 'BOSS直聘', sourceType: '招聘平台',
    sourceUrl: 'https://m.zhipin.com/zhaopin/1c5f61f0d20c1fe403x_3t2-Eg~~/', capturedAt: today,
  },
  {
    id: 'official-black-sesame-perception', title: '环境感知算法工程师（机器人，J11194）', organization: '黑芝麻智能',
    city: '深圳', location: '广东省深圳市', recruitmentType: '社招', salary: '未公开',
    education: '本科及以上', experience: '3年以上',
    requirements: '计算机、人工智能、机器人或自动化相关专业，具有计算机视觉、机器人感知或自动驾驶感知经验。',
    skills: ['目标检测', '语义分割', '3D感知', '多传感器融合', 'ROS2', '端侧部署'],
    summary: '面向割草机器人和机场无人底盘研发视觉、多传感器感知、数据闭环和端侧部署能力。',
    sourceName: '黑芝麻智能招聘官网', sourceType: '企业官网',
    sourceUrl: 'https://bsthr.zhiye.com/social/detail?jobAdId=4df8b0f0-1124-4476-a501-4cf11fa0fc9f', capturedAt: today,
  },
  {
    id: 'official-xyz-embodied-system', title: '具身智能系统工程师（2027 校园招聘）', organization: 'XYZ Robotics',
    city: '上海', location: '上海', recruitmentType: '校招', salary: '未公开',
    education: '本科及以上', experience: '2027届应届生',
    requirements: '机电、机器人、计算机或自动化控制相关专业，熟悉 C++、Python 与机器人算法工程化。',
    skills: ['机器人系统集成', 'C++', 'Python', 'ROS2', '模型部署', '现场交付'],
    summary: '整合感知、规划和控制能力，建设可在真实产线运行的端到端机器人系统。',
    sourceName: 'XYZ Robotics 招聘官网', sourceType: '企业官网',
    sourceUrl: 'https://xyzrobotics.jobs.feishu.cn/2026/position/7670803894288877887/detail', capturedAt: today,
  },
  {
    id: 'official-ai2robotics-cpp', title: '机器人 C++ 软件工程师', organization: '智平方',
    city: '北京 / 深圳', location: '北京 / 深圳', recruitmentType: '社招', salary: '未公开',
    education: '本科及以上', experience: '3年以上优先',
    requirements: '电子信息、自动化、控制、计算机或人工智能相关专业，熟悉 C++、ROS2、CAN 或 EtherCAT。',
    skills: ['C++', 'ROS2', 'CAN', 'EtherCAT', '机器人基础软件', '性能优化'],
    summary: '研发机器人底层软件、系统架构和核心框架，完成算法集成及资源性能优化。',
    sourceName: '智平方招聘官网', sourceType: '企业官网',
    sourceUrl: 'https://ai2robotics.jobs.feishu.cn/094992/position/7547314312236615986/detail', capturedAt: today,
  },
  {
    id: 'official-ai2robotics-embedded', title: '嵌入式软件工程师', organization: '智平方',
    city: '北京 / 深圳', location: '北京 / 深圳', recruitmentType: '社招', salary: '未公开',
    education: '本科及以上', experience: '以官方页面为准',
    requirements: '软件、电子、通信、自动化、计算机或机器人相关专业，熟悉 C/C++、Linux、单片机与总线通信。',
    skills: ['嵌入式开发', 'C/C++', 'Linux', 'Jetson', 'CANOpen', 'EtherCAT'],
    summary: '负责机器人嵌入式程序、实时系统、外设接口与通信总线功能开发。',
    sourceName: '智平方招聘官网', sourceType: '企业官网',
    sourceUrl: 'https://ai2robotics.jobs.feishu.cn/094992/position/7547314619989494057/detail', capturedAt: today,
  },
];

function inferSourceType(sourceName: string, organizationType?: string): RoboticsSourceType {
  if (/BOSS|猎聘|实习僧|聚合|牛客|学术桥|求职|招聘平台/i.test(sourceName)) return '招聘平台';
  if (/大学|研究院|研究所|实验室|高校|课题组/.test(organizationType ?? sourceName)) return '高校/研究机构';
  return '企业官网';
}

function inferRecruitmentType(title: string, recruitType?: string): RoboticsRecruitmentType {
  if (/博士后/.test(title)) return '博士后';
  if (/实习/.test(title) || recruitType === '实习') return '实习';
  if (/校招|应届|校园/.test(title) || recruitType === '校招') return '校招';
  return '社招';
}

function cityFromLocation(location: string) {
  const city = location.split(/[·\/]/)[0].replace(/市$/, '').trim();
  return city || '其他';
}

function toSeeds(): Seed[] {
  const fullTimeSeeds: Seed[] = realJobs
    .filter((job) => job.platform_disciplines.includes('机器人×仿真算法') || taggedJobIds.has(job.id))
    .map((job) => ({
      id: `job-${job.id}`,
      title: job.title,
      organization: job.organization,
      city: job.city,
      location: job.location,
      recruitmentType: inferRecruitmentType(job.title, job.recruit_type),
      salary: job.salary?.trim() || '未公开',
      education: job.education,
      experience: job.experience,
      requirements: job.original_major_requirements,
      skills: [...job.required_skills, ...job.preferred_skills].slice(0, 10),
      summary: job.description,
      sourceName: job.source_name,
      sourceType: inferSourceType(job.source_name, job.org_type),
      sourceUrl: job.source_url,
      capturedAt: job.fetched_at,
    }));

  const internshipSeeds: Seed[] = internshipListings
    .filter((job) => ['embodied', 'simulation'].includes(job.track) && !excludedInternshipIds.has(job.id))
    .map((job) => ({
      id: `internship-${job.id}`,
      title: job.title,
      organization: job.organization,
      city: cityFromLocation(job.location),
      location: job.location,
      recruitmentType: '实习',
      salary: job.pay,
      education: job.education,
      experience: job.cohort ?? '在校生',
      requirements: [job.education, job.cohort].filter(Boolean).join('；'),
      skills: job.summary.split(/[，、；]/).map((item) => item.trim()).filter((item) => item.length >= 2).slice(0, 6),
      summary: job.summary,
      sourceName: job.sourceName ?? 'BOSS直聘',
      sourceType: inferSourceType(job.sourceName ?? 'BOSS直聘', job.organizationType),
      sourceUrl: job.sourceUrl,
      capturedAt: job.capturedAt,
    }));

  return [...fullTimeSeeds, ...internshipSeeds, ...extraPublicJobs];
}

async function verifySource(url: string): Promise<SourceCheck> {
  if (offline) return { sourceStatus: '受限或需复核' as const, httpStatus: null };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'JiaodianCareersResearch/1.0 (+public job market research; one request per curated URL)',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    return {
      sourceStatus: response.ok ? '可访问' as const : '受限或需复核' as const,
      httpStatus: response.status,
    };
  } catch {
    return { sourceStatus: '受限或需复核' as const, httpStatus: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  const deduplicated = [...new Map(toSeeds().map((seed) => [
    `${seed.organization}|${seed.title}|${seed.city}`.toLowerCase(),
    seed,
  ])).values()];

  const sourceChecks = new Map<string, SourceCheck>();
  const uniqueUrls = [...new Set(deduplicated.map((seed) => seed.sourceUrl))];
  const checks = await mapWithConcurrency(uniqueUrls, 4, async (url) => ({ url, ...(await verifySource(url)) }));
  for (const check of checks) {
    sourceChecks.set(check.url, { sourceStatus: check.sourceStatus, httpStatus: check.httpStatus });
  }

  const jobs: RoboticsMarketJob[] = deduplicated.map((seed) => {
    const detail = [seed.requirements, seed.skills.join(' '), seed.summary].join(' ');
    const check = sourceChecks.get(seed.sourceUrl) ?? { sourceStatus: '受限或需复核' as const, httpStatus: null };
    return {
      ...seed,
      direction: classifyRoboticsDirection(seed.title, detail),
      normalizedSalary: normalizeSalary(seed.salary),
      verifiedAt: today,
      ...check,
    };
  }).sort((a, b) => a.direction.localeCompare(b.direction) || a.city.localeCompare(b.city, 'zh-CN'));

  const dataset: RoboticsMarketDataset = {
    generatedAt: today,
    scope: '全国公开招聘岗位定向样本，来源覆盖企业官网、官方招聘系统、高校与研究机构页面及公开招聘平台。',
    methodology: [
      '只读取无需登录即可访问的公开页面，不绕过验证码、登录或访问限制。',
      '按“单位 + 岗位名称 + 城市”去重；同一岗位涉及多个方向时，按标题和主要交付物归入一个主方向。',
      '薪资只统计来源中明确公开的区间；月薪与日薪分开标准化，面议和未公开不参与薪资中位数。',
      '这是定向样本而非招聘平台全量数据，适合比较样本结构，不等同于全国市场份额。',
    ],
    jobs,
  };

  const outputDirectory = path.join(process.cwd(), 'src/data/generated');
  const outputFile = path.join(outputDirectory, 'robotics-market.json');
  const publicDataDirectory = path.join(process.cwd(), 'public/data');
  const publicJsonFile = path.join(publicDataDirectory, 'robotics-market.json');
  const publicCsvFile = path.join(publicDataDirectory, 'robotics-market.csv');
  await mkdir(outputDirectory, { recursive: true });
  await mkdir(publicDataDirectory, { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
  await writeFile(publicJsonFile, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  const directionNames = Object.fromEntries(roboticsDirectionDefinitions.map((item) => [item.id, item.name]));
  const escapeCsv = (value: string | number | null) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csvRows = [
    ['岗位ID', '岗位名称', '单位', '城市', '详细地点', '主要方向', '招聘类型', '薪资', '学历', '经验', '岗位需求', '技能', '来源', '来源类型', '来源链接', '采集日期', '核验日期', '来源状态'],
    ...jobs.map((job) => [
      job.id, job.title, job.organization, job.city, job.location, directionNames[job.direction],
      job.recruitmentType, job.salary, job.education, job.experience, job.requirements, job.skills.join(' / '),
      job.sourceName, job.sourceType, job.sourceUrl, job.capturedAt, job.verifiedAt, job.sourceStatus,
    ]),
  ];
  await writeFile(publicCsvFile, `${csvRows.map((row) => row.map(escapeCsv).join(',')).join('\n')}\n`, 'utf8');

  const accessible = jobs.filter((job) => job.sourceStatus === '可访问').length;
  console.log(`Generated ${jobs.length} jobs from ${uniqueUrls.length} public source URLs.`);
  console.log(`Source checks: ${accessible} accessible, ${jobs.length - accessible} restricted or requiring review.`);
  console.log(`Output: ${outputFile}`);
  console.log(`Downloads: ${publicJsonFile}, ${publicCsvFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
