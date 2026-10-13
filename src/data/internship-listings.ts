export const internshipTracks = [
  { id: 'ai4s', title: 'AI4S · 科学智能', description: '把机器学习、算力与科研问题连接起来，覆盖生命科学、药物和材料等场景。' },
  { id: 'medical', title: '医疗 × AI', description: '医学影像、临床算法、医疗大模型与手术机器人等应用方向。' },
  { id: 'bio', title: '生物学 × AI', description: '生物信息学、蛋白质建模、AI 制药和生命科学大模型。' },
  { id: 'embodied', title: '具身智能', description: '机器人感知、操作、VLA、强化学习与真实环境中的算法验证。' },
] as const;

export type InternshipTrackId = (typeof internshipTracks)[number]['id'];

export interface InternshipListing {
  id: string;
  track: InternshipTrackId;
  title: string;
  organization: string;
  organizationType: string;
  location: string;
  pay: string;
  education: string;
  cohort?: string;
  summary: string;
  sourceUrl: string;
  capturedAt: string;
}

// BOSS直聘 public listing-page snapshots collected on 2026-10-13. Treat these
// as leads: openings, pay, and requirements can change or close at any time.
export const internshipListings: InternshipListing[] = [
  {
    id: 'ai4s-wuhan-ai-institute', track: 'ai4s', title: 'AI4S 算法实习生',
    organization: '武汉人工智能研究院', organizationType: '研究院', location: '北京',
    pay: '200–400 元/天', education: '硕士',
    summary: '参与生命科学领域大模型研发、训练和评估，涉及 AI 疫苗设计、药物研发等科学智能研究。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/f2d67c9b61c0185e0Hd609q_/', capturedAt: '2026-10-13',
  },
  {
    id: 'deepwise-science-agent', track: 'ai4s', title: '科研 Agent 产品运营实习生',
    organization: '深势科技', organizationType: '科技企业', location: '上海·徐汇',
    pay: '350–400 元/天', education: '本科',
    summary: '参与实验设计、数据分析等科学智能体的产品规划，梳理药物设计、材料发现中的科研工作流。',
    sourceUrl: 'https://m.zhipin.com/zhaopin/0e93289e0a6d36ef0HF72NW1/', capturedAt: '2026-10-13',
  },
  {
    id: 'taichuang-clinical-ai', track: 'medical', title: '临床医疗 AI 算法实习生',
    organization: '湖州太创生物医疗技术', organizationType: '医疗科技企业', location: '湖州',
    pay: '150–200 元/天', education: '硕士及以上',
    summary: '临床算法岗位，招聘信息接受计算机、人工智能、生物医学工程、医学影像、应用数学和统计等相关背景。',
    sourceUrl: 'https://m.zhipin.com/zhaopin/dc56472de279a5b01nF92di6GQ~~/', capturedAt: '2026-10-13',
  },
  {
    id: 'huawei-medical-llm', track: 'medical', title: '医疗大模型方向 AI 实习生',
    organization: '华为', organizationType: '科技企业', location: '北京·海淀',
    pay: '400–450 元/天', education: '硕士',
    summary: '参与医疗大模型前沿调研、Prompt 优化、推理加速、训练调优与领域微调。',
    sourceUrl: 'https://m.zhipin.com/zhaopin/dc56472de279a5b01nF92di6GQ~~/', capturedAt: '2026-10-13',
  },
  {
    id: 'miaocheng-surgical-robot', track: 'medical', title: '医疗手术机器人算法实习生',
    organization: '妙成医疗', organizationType: '医疗科技企业', location: '北京·海淀',
    pay: '160–250 元/天', education: '硕士',
    summary: '围绕手术机器人开展图像分割、重建和配准，适合关注医学影像与机器人交叉的同学。',
    sourceUrl: 'https://m.zhipin.com/zhaopin/dc56472de279a5b01nF92di6GQ~~/', capturedAt: '2026-10-13',
  },
  {
    id: 'jindu-bio-ai', track: 'bio', title: 'AI 算法实习生（生物信息学 / 深度学习）',
    organization: '津渡生科', organizationType: '生物科技企业', location: '深圳·南山',
    pay: '350–400 元/天', education: '硕士', cohort: '面向 2027 / 2028 届在校生',
    summary: '参与蛋白质结构预测、序列分析、NLP、大语言模型或医学影像相关算法研发。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/7e26050f7e17e6d81nB_2ty9EQ~~/', capturedAt: '2026-10-13',
  },
  {
    id: 'yuansi-ai-drug-design', track: 'bio', title: 'AI 药物设计算法实习生',
    organization: '北京元思生肽科技', organizationType: '生物科技企业', location: '北京·海淀',
    pay: '250–450 元/天', education: '硕士',
    summary: '面向 AI+Bio、AI4Science、AI4Protein，涉及生物分子序列与结构建模、蛋白质设计。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/f7fb7b4782404e890HN709u1/', capturedAt: '2026-10-13',
  },
  {
    id: 'hongbo-aidd', track: 'bio', title: 'AIDD 实习生',
    organization: '泓博医药', organizationType: '医药企业', location: '上海·浦东',
    pay: '200–400 元/天', education: '硕士',
    summary: '加入 AI 药物发现平台，接触真实药物研发问题及大模型、智能体、多模态技术。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/b7e6d71074b05cf0031z3tS0Ew~~/', capturedAt: '2026-10-13',
  },
  {
    id: 'zhiyuan-embodied-vla', track: 'embodied', title: '具身 VLA 算法工程师（实习生）',
    organization: '智源人工智能研究院', organizationType: '研究院', location: '北京·海淀·学院路',
    pay: '330–380 元/天', education: '硕士',
    summary: '探索 VLM、VLA 与世界模型在真实机器人场景中的结合，提升具身策略泛化和鲁棒性。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/6f7c45e6f7f38cb503J439q-EA~~/', capturedAt: '2026-10-13',
  },
  {
    id: 'jd-exploration-embodied', track: 'embodied', title: '京东探索研究院·具身操作算法实习生',
    organization: '京东探索研究院', organizationType: '企业研究院', location: '北京',
    pay: '400–500 元/天', education: '本科',
    summary: '开展视觉-语言-动作（VLA）模型算法研发，涉及模型架构、数据处理与训练方法。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/44fccc733a250ee20Hdy2t-0/', capturedAt: '2026-10-13',
  },
  {
    id: 'zhiyuan-embodied-algorithm', track: 'embodied', title: '具身智能算法实习生',
    organization: '智源人工智能研究院', organizationType: '研究院', location: '北京·海淀·苏州桥',
    pay: '200–400 元/天', education: '本科',
    summary: '参与室内移动操作机器人平台的感知、决策与控制算法研发及仿真、集成测试。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/edd58b3f4970c4851n1-2d-_Fw~~/', capturedAt: '2026-10-13',
  },
  {
    id: 'zhiyuan-robot-embodied', track: 'embodied', title: '具身算法实习生',
    organization: '智元机器人', organizationType: '机器人企业', location: '上海·浦东·康桥',
    pay: '200–400 元/天', education: '硕士',
    summary: '研发用于人形机器人任务的模仿学习与强化学习算法，探索视觉、触觉和语言多模态感知决策。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/b7e6d71074b05cf0031z3tS0Ew~~/', capturedAt: '2026-10-13',
  },
  {
    id: 'zhishifang-vla', track: 'embodied', title: '机器人 VLA 算法实习生',
    organization: '智平方', organizationType: '机器人企业', location: '北京·朝阳·望京',
    pay: '300–350 元/天', education: '本科',
    summary: '面向轮式人形机器人的移动、交互和操作任务，参与 VLA / WAM 模型研发、训练与评测。',
    sourceUrl: 'https://m.zhipin.com/zhaopin/b4b730a4386f0129331y3di4/', capturedAt: '2026-10-13',
  },
];
