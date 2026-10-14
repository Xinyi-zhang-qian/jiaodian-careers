export type RoboticsDirection = {
  id: string;
  name: string;
  shortName: string;
  focus: string;
  typicalRoles: string[];
  coreSkills: string[];
  workSample: string;
  signal: string;
  fit: string;
};

export type RoboticsOpportunity = {
  id: string;
  category: '实习' | '博士后' | '企业岗位';
  title: string;
  organization: string;
  location: string;
  direction: string;
  requirements: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  internalUrl?: string;
};

export const roboticsAiAnalysis = {
  updatedAt: '2026-10-14',
  sampleNote: '基于当前仍可访问的单位官网岗位样本归纳，适合用来理解岗位分工，不代表全行业职位数量。',
  directions: [
    {
      id: 'vla',
      name: '具身大模型与 VLA',
      shortName: 'VLA / 大模型',
      focus: '把视觉、语言和动作统一建模，让机器人理解指令并完成跨任务操作。',
      typicalRoles: ['具身大模型研究员', 'VLA 算法工程师', '多模态 Agent 算法工程师'],
      coreSkills: ['Transformer / DiT', '多模态对齐', 'SFT 与 RL 后训练', '分布式训练', '真机部署'],
      workSample: '展示一个从数据整理、模型微调到真机评测的完整闭环，并解释失败案例。',
      signal: '当前样本中的研究型岗位最密集，硕博偏好明显。',
      fit: '适合有大模型、多模态、机器人学习论文或训练经验的人。',
    },
    {
      id: 'simulation',
      name: '仿真、物理引擎与合成数据',
      shortName: '仿真 / Sim2Real',
      focus: '搭建机器人与传感器模型、生成训练数据，并缩小仿真到真实环境的差异。',
      typicalRoles: ['机器人仿真工程师', '物理引擎开发工程师', '合成数据算法工程师'],
      coreSkills: ['C++ / Python', 'Isaac Sim / MuJoCo', '刚体动力学', '渲染与传感器建模', 'Domain Randomization'],
      workSample: '搭建可复现的机器人任务环境，给出仿真精度、吞吐和 Sim2Real 误差分析。',
      signal: '研究机构与企业均有需求，岗位名称更具体、工程边界更清楚。',
      fit: '适合图形学、力学、控制、游戏引擎或高性能计算背景。',
    },
    {
      id: 'learning',
      name: '模仿学习与强化学习',
      shortName: 'IL / RL',
      focus: '利用演示数据和环境反馈训练操作、行走与全身协同策略。',
      typicalRoles: ['机器人学习算法工程师', '强化学习研究员', '灵巧操作算法工程师'],
      coreSkills: ['Behavior Cloning', 'Diffusion Policy', 'PPO / SAC / GRPO', '奖励设计', '真机微调'],
      workSample: '用统一指标比较 IL、RL 和混合训练，并展示策略在扰动下的鲁棒性。',
      signal: '常与 VLA、灵巧操作和全身控制合并招聘，真机经验是重要区分项。',
      fit: '适合有强化学习、控制或机器人操作项目经验的人。',
    },
    {
      id: 'perception',
      name: '感知、定位与空间智能',
      shortName: '感知 / 3D / SLAM',
      focus: '融合相机、激光雷达、IMU 和触觉，让机器人建立可用于行动的环境表征。',
      typicalRoles: ['多模态感知工程师', '3D 视觉算法工程师', 'SLAM / VIO 工程师'],
      coreSkills: ['3D Vision', 'VLM', 'SLAM / VIO', '多传感器标定', '触觉感知'],
      workSample: '提供真实传感器数据上的定位、重建或识别结果，并说明标定和时序同步方法。',
      signal: '岗位成熟度较高，既有传统机器人栈，也出现视觉语言与触觉融合需求。',
      fit: '适合计算机视觉、测绘、自动驾驶、信号处理和传感器背景。',
    },
    {
      id: 'control',
      name: '运动规划、控制与灵巧操作',
      shortName: '规划 / 控制',
      focus: '把高层任务转成安全、实时、稳定的轨迹和关节动作。',
      typicalRoles: ['运动规划工程师', '全身控制算法工程师', '力控装配算法工程师'],
      coreSkills: ['运动学与动力学', 'MPC / WBC', '轨迹优化', '力控', 'ROS / ROS2'],
      workSample: '在仿真和真机上完成同一任务，展示轨迹误差、实时性、安全约束与恢复策略。',
      signal: '离机器人落地最近，企业通常更看重系统调试与跨团队交付经验。',
      fit: '适合自动化、控制、机械电子和机器人本体背景。',
    },
    {
      id: 'data-eval',
      name: '数据、评测与工程部署',
      shortName: '数据 / 评测 / 部署',
      focus: '建设采集、清洗、训练、评测、推理优化和线上回流的数据闭环。',
      typicalRoles: ['具身数据开发工程师', '模型评测工程师', 'AI 软件工程师'],
      coreSkills: ['数据管线', 'Benchmark 设计', '训练评测平台', 'C++ 推理优化', '失败分析'],
      workSample: '做一套可重复运行的评测流水线，说明指标、数据版本、回归测试和瓶颈定位。',
      signal: '不只服务算法研究，也是量产团队扩大后持续增加的工程需求。',
      fit: '适合数据工程、测试开发、后端、系统优化和 MLOps 背景。',
    },
    {
      id: 'hardware-system',
      name: '机器人本体与系统集成',
      shortName: '本体 / 系统',
      focus: '完成机械、电控、嵌入式、中间件和整机可靠性的协同设计。',
      typicalRoles: ['机器人结构工程师', '嵌入式工程师', '机器人系统工程师'],
      coreSkills: ['机械设计', '电机与驱动', '嵌入式开发', '实时系统', '整机联调'],
      workSample: '展示一个真实硬件模块从设计、控制到可靠性测试的全过程与量化结果。',
      signal: '岗位数量不依赖单一模型路线，是机器人产品化不可缺少的底层方向。',
      fit: '适合机械、电子、自动化、嵌入式和系统工程背景。',
    },
  ] satisfies RoboticsDirection[],
  opportunities: [
    {
      id: 'tsinghua-air-embodied-intern', category: '实习', title: '具身智能科研实习生',
      organization: '清华大学智能产业研究院（AIR）', location: '北京', direction: 'VLA / 生成式模型 / 强化学习',
      requirements: '本硕博在读；每周不少于 4 天、连续不少于 6 个月',
      summary: '研究具身模型架构与建模机制，岗位明确提到 Diffusion、Flow Matching、强化学习以及 VLA / WAM。',
      sourceUrl: 'https://air.tsinghua.edu.cn/info/1030/2541.htm', sourceName: '清华大学 AIR 官网', internalUrl: '/internships#embodied',
    },
    {
      id: 'imprintx-manipulation-intern', category: '实习', title: '机器人操作算法实习生（人手—灵巧手重定向）',
      organization: '知行具身 ImprintX', location: '北京', direction: '灵巧操作 / 触觉 / 模仿学习',
      requirements: '硕士或博士在读；每周 4 天、至少 3 个月',
      summary: '参与人手到灵巧手重定向与触觉增强模仿学习，把人类操作数据转成机器人可学习的行为。',
      sourceUrl: 'https://imprintx.cn/careers', sourceName: '知行具身官网', internalUrl: '/internships#embodied',
    },
    {
      id: 'suat-embodied-postdoc', category: '博士后', title: '具身智能装备技术博士后',
      organization: '深圳理工大学具身智造研究院（筹）', location: '深圳', direction: '具身智能 / 自动化实验室 / AI4Science',
      requirements: '近三年获博士学位、原则上不超过 35 周岁；理工科相关背景',
      summary: '围绕具身智能体、智能装备、大模型及机器人协同系统开展研究，公告长期有效。',
      sourceUrl: 'https://rczpw.suat-sz.edu.cn/info/1014/1740.htm', sourceName: '深圳理工大学官网', internalUrl: '/jobs/587',
    },
    {
      id: 'tsinghua-air-robot-postdoc', category: '博士后', title: '智能机器人方向博士后',
      organization: '清华大学智能产业研究院（AIR）', location: '北京', direction: '仿真 / 世界模型 / 具身算法',
      requirements: '机器人、自动化、计算机、控制等相关研究背景；长期招聘、招满即止',
      summary: '方向覆盖高保真仿真、Sim2Real、VLM / VLA、世界模型、规划控制与机器人评测。',
      sourceUrl: 'https://air.tsinghua.edu.cn/info/1030/2339.htm', sourceName: '清华大学 AIR 官网', internalUrl: '/jobs/588',
    },
    {
      id: 'bytedance-seed-simulation', category: '企业岗位', title: '机器人仿真工程师（物理引擎方向）-Seed',
      organization: '字节跳动 Seed', location: '北京', direction: '物理引擎 / 仿真',
      requirements: '社招；具体学历与经验要求以投递页为准',
      summary: 'Seed 官方招聘页列出的机器人仿真岗位，与具身数据开发和机器人本体岗位共同构成机器人研发链路。',
      sourceUrl: 'https://seed.bytedance.com/zh/career?view_from=homepage_tab', sourceName: '字节跳动 Seed 官网', internalUrl: '/jobs/583',
    },
    {
      id: 'xpeng-embodied-agent', category: '企业岗位', title: '具身智能算法工程师 / 研究员（智能体）',
      organization: '小鹏汽车', location: '深圳 / 北京 / 上海', direction: '大模型后训练 / Agent / 具身智能',
      requirements: '全职；大模型训练、数据构建、强化学习或智能体相关经验',
      summary: '聚焦监督微调、强化学习、在线蒸馏、持续学习，以及工具调用和长程任务执行。',
      sourceUrl: 'https://xiaopeng.jobs.feishu.cn/index/position/7665387666716723475/detail', sourceName: '小鹏集团招聘官网', internalUrl: '/jobs/584',
    },
    {
      id: 'agibot-vla', category: '企业岗位', title: '具身算法工程师（VLA / WAM / RL）',
      organization: '智元机器人', location: '上海', direction: 'VLA / WAM / 强化学习',
      requirements: '全职；要求机器人基础、深度学习框架和仿真环境经验',
      summary: '覆盖数据采集、模型训练、WBC / MPC 接口、仿真与真机部署的完整链路。',
      sourceUrl: 'https://agirobot.jobs.feishu.cn/socialrecruitment/position/7664603823793309988/detail', sourceName: '智元机器人招聘官网', internalUrl: '/jobs/585',
    },
    {
      id: 'iflytek-embodied-model', category: '企业岗位', title: 'AI 研究算法工程师（具身智能大模型方向）',
      organization: '科大讯飞', location: '合肥', direction: '多模态大模型 / 强化学习 / SLAM',
      requirements: '校园招聘；具体学历要求以官方岗位页为准',
      summary: '研究多模态统一具身大模型、强化学习与 SLAM，强调复杂真实环境中的鲁棒性和泛化。',
      sourceUrl: 'https://iflytek.zhiye.com/campus/detail?jobAdId=348e3ed3-a7cf-426d-bda4-59a83d815a2c', sourceName: '科大讯飞招聘官网', internalUrl: '/jobs/586',
    },
    {
      id: 'imprintx-physics-engine', category: '企业岗位', title: '物理引擎开发工程师（机器人触觉仿真）',
      organization: '知行具身 ImprintX', location: '北京', direction: '触觉仿真 / 物理引擎',
      requirements: '本科及以上；3–5 年经验',
      summary: '面向柔性触觉传感器和接触任务开发高性能物理引擎，支持算法验证与触觉数据生成。',
      sourceUrl: 'https://imprintx.cn/careers', sourceName: '知行具身官网', internalUrl: '/jobs/589',
    },
  ] satisfies RoboticsOpportunity[],
};
