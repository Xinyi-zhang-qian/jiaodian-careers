export const internshipTracks = [
  { id: 'ai4s', title: 'AI4S · 科学智能', description: '把机器学习、算力与科研问题连接起来，覆盖生命科学、药物和材料等场景。' },
  { id: 'medical', title: '医疗 × AI', description: '医学影像、临床算法、医疗大模型与手术机器人等应用方向。' },
  { id: 'bio', title: '生物学 × AI', description: '生物信息学、蛋白质建模、AI 制药和生命科学大模型。' },
  { id: 'embodied', title: '具身智能', description: '机器人感知、操作、VLA、强化学习与真实环境中的算法验证。' },
  { id: 'philosophy_ethics', title: '哲学 · 科技伦理', description: '科学技术哲学、AI 伦理、算法治理、数据合规与科技政策研究。' },
  { id: 'simulation', title: '仿真算法', description: '物理仿真、数值模拟、机器人仿真、世界模型与 Sim2Real。' },
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
  sourceName?: string;
}

// Public recruitment-page snapshots collected through 2026-10-14. Treat these as
// leads: openings, pay, and requirements can change or close at any time.
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
  {
    id: 'tsinghua-air-embodied-research', track: 'embodied', title: '具身智能科研实习生',
    organization: '清华大学智能产业研究院（AIR）', organizationType: '高校研究院', location: '北京·海淀',
    pay: '以招聘方确认为准', education: '本硕博在读', cohort: '每周不少于 4 天，连续不少于 6 个月',
    summary: '开展具身智能模型架构及建模机制研究，岗位明确提到 Diffusion、Flow Matching、强化学习以及灵巧操作 VLA / WAM。',
    sourceUrl: 'https://air.tsinghua.edu.cn/info/1030/2541.htm', capturedAt: '2026-10-14', sourceName: '清华大学 AIR 官网',
  },
  {
    id: 'imprintx-dexterous-retargeting', track: 'embodied', title: '机器人操作算法实习生（人手—灵巧手重定向）',
    organization: '知行具身 ImprintX', organizationType: '具身智能企业', location: '北京·海淀',
    pay: '面议', education: '硕士或博士在读', cohort: '每周 4 天，至少 3 个月',
    summary: '参与人手到灵巧手重定向与触觉增强模仿学习，把人类操作数据转化为真实机器人可复现、可学习的灵巧行为。',
    sourceUrl: 'https://imprintx.cn/careers', capturedAt: '2026-10-14', sourceName: '知行具身官网',
  },
  {
    id: 'pku-embodied-research-assistant', track: 'embodied', title: '具身智能科研助理实习生',
    organization: '北京大学信息工程学院钟方成项目组', organizationType: '高校课题组', location: '北京',
    pay: '面议', education: '本科及以上', cohort: '截止 2026-10-16',
    summary: '协助开展人工智能、具身智能科研项目的资料调研、实验、数据处理与项目推进；机器人或机器学习经历优先。',
    sourceUrl: 'https://www.ece.pku.edu.cn/info/1008/3231.htm', capturedAt: '2026-10-13', sourceName: '北京大学官网',
  },
  {
    id: 'shlab-science-data-governance', track: 'philosophy_ethics', title: '科学数据治理实习生',
    organization: '上海人工智能实验室', organizationType: '研究机构', location: '上海',
    pay: '面议', education: '本科或硕士在读', cohort: '每周至少 4 天，连续 6 个月以上',
    summary: '开展前沿科学、人文、经济与产业线索调研，利用 AI 工具进行数据分类分级、标签定义、清洗和质量治理。',
    sourceUrl: 'https://www.shlab.org.cn/joinus/detail/7686361384142162212?jobFunction=&jobType=&keyword=&location=&mode=campus&subject=', capturedAt: '2026-10-13', sourceName: '上海人工智能实验室官网',
  },
  {
    id: 'ilinkgood-ai-governance', track: 'philosophy_ethics', title: '算法伦理与 AI 治理项目实习生',
    organization: '上海共益数据科技发展基金会', organizationType: '公益基金会', location: '上海·浦东',
    pay: '以招聘方确认为准', education: '大三及以上本科或研究生', cohort: '长期招募 · 至少 3 个月',
    summary: '参与数据资产化、算法伦理和 AI 治理相关公益项目，适合哲学、法学、公共政策与数据治理背景。',
    sourceUrl: 'https://www.chinadevelopmentbrief.org.cn/jobs/detail/66373.html', capturedAt: '2026-10-13', sourceName: '发展简报',
  },
  {
    id: 'kuaishou-kling-data-compliance', track: 'philosophy_ethics', title: '数据合规实习生（可灵 AI 专项）',
    organization: '快手', organizationType: '科技企业', location: '北京',
    pay: '以招聘方确认为准', education: '法学相关专业在校生',
    summary: '参与生成式 AI 产品的数据合规工作，接触隐私、数据治理与科技伦理议题；申请前需在招聘官网确认状态。',
    sourceUrl: 'https://watchjobs.net/zh/explore/job/c261-5aee71be3e039618/%E6%95%B0%E6%8D%AE%E5%90%88%E8%A7%84%E5%AE%9E%E4%B9%A0%E7%94%9F-%E5%8F%AF%E7%81%B5AI%E4%B8%93%E9%A1%B9-%E5%BF%AB%E6%89%8B', capturedAt: '2026-10-13', sourceName: '招聘聚合页（需回官网核验）',
  },
  {
    id: 'sensetime-ai-ethics-strategy', track: 'philosophy_ethics', title: '战略研究实习生（AI 伦理方向）',
    organization: '商汤科技智研院', organizationType: '企业研究院', location: '北京',
    pay: '以招聘方确认为准', education: '本科或研究生在读',
    summary: '跟踪国内外人工智能伦理、政策法规及产业动态，开展资料研究、信息分析、可视化处理和英文翻译。',
    sourceUrl: 'https://www.nowcoder.com/jobs/detail/187814', capturedAt: '2026-10-13', sourceName: '牛客招聘（需回官网核验）',
  },
  {
    id: 'caict-ai-governance', track: 'philosophy_ethics', title: '人工智能治理研究实习生',
    organization: '中国信息通信研究院', organizationType: '科研院所', location: '北京',
    pay: '以招聘方确认为准', education: '硕士在读或应届毕业生',
    summary: '研究前沿 AI 技术治理措施与国内外科技伦理政策法规，参与科技伦理治理标准和研究报告撰写，接受哲学、法律及人工智能背景。',
    sourceUrl: 'https://www.chaojijianli.com/xiaozhao/caict-2026-intern-beijing-10590-0df862/', capturedAt: '2026-10-13', sourceName: '招聘聚合页（需回官网核验）',
  },
  {
    id: 'xinzhu-plasma-simulation', track: 'simulation', title: '等离子体物理数值模拟实习生',
    organization: '北京新烛时代科技有限公司', organizationType: 'AI4S 企业', location: '北京',
    pay: '以招聘方确认为准', education: '本科高年级、硕士或博士在读',
    summary: '参与聚变等离子体模拟与智能研发平台建设，开展仿真程序部署、算例复现、装置适配和参数扫描。',
    sourceUrl: 'https://career.nankai.edu.cn/correcruit/content/id/118019.html', capturedAt: '2026-10-13', sourceName: '南开大学就业信息网',
  },
  {
    id: 'lightwheel-embodied-simulation-beijing', track: 'simulation', title: '具身智能仿真开发实习生',
    organization: '光轮智能', organizationType: '具身智能企业', location: '北京·海淀·学院路',
    pay: '300–400 元/天', education: '本科',
    summary: '参与具身智能仿真系统、仿真环境、仿真引擎和工具链的开发与优化。',
    sourceUrl: 'https://www.zhipin.com/zhaopin/e84791c11a695f5003xy3tS6Ew~~/', capturedAt: '2026-10-13', sourceName: 'BOSS 直聘',
  },
  {
    id: 'xiaomi-robot-simulation', track: 'simulation', title: '机器人仿真工程师实习生',
    organization: '小米', organizationType: '科技企业', location: '北京·通州',
    pay: '300–350 元/天', education: '硕士',
    summary: '负责双足人形机器人机械结构、动力学、传感器与控制系统建模，并开发维护机器人仿真平台。',
    sourceUrl: 'https://m.zhipin.com/zhaopin/e84791c11a695f5003xy3tS6Ew~~/', capturedAt: '2026-10-13', sourceName: 'BOSS 直聘',
  },
  {
    id: 'agibot-embodied-simulation', track: 'simulation', title: '具身智能仿真实习生',
    organization: '智元机器人', organizationType: '机器人企业', location: '上海·浦东·康桥',
    pay: '300–500 元/天', education: '硕士',
    summary: '研发具身智能仿真引擎、传感器和运控模型，构建仿真合成数据、评测场景与自动化场景生成工具。',
    sourceUrl: 'https://m.zhipin.com/zhaopin/a0b48f456169510203Zz39m1Fg~~/', capturedAt: '2026-10-13', sourceName: 'BOSS 直聘',
  },
  {
    id: 'lightwheel-simulation-engine-shanghai', track: 'simulation', title: '具身智能仿真引擎实习生',
    organization: '光轮智能', organizationType: '具身智能企业', location: '上海·嘉定·安亭',
    pay: '300–600 元/天', education: '本科',
    summary: '参与融合物理求解、机器人控制与 AI 算法的高保真具身智能仿真引擎开发。',
    sourceUrl: 'https://m.zhipin.com/zhaopin/a0b48f456169510203Zz39m1Fg~~/', capturedAt: '2026-10-13', sourceName: 'BOSS 直聘',
  },
];
