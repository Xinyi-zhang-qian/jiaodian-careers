export interface PlatformListing {
  platform: string;
  title: string;
  organization: string;
  location: string;
  salary: string;
  requirements: string;
  connection: string;
  summary: string;
  sourceUrl: string;
  capturedAt: string;
}

// Public job-page snapshots collected on 2026-10-13. These are leads, not
// guarantees that the employer is still accepting applications.
export const platformListings: PlatformListing[] = [
  {
    platform: 'BOSS直聘',
    title: 'AI 产品经理（Agent 研发平台）',
    organization: 'Moka',
    location: '深圳',
    salary: '20–40K/月',
    requirements: '3–5 年 · 本科',
    connection: '人力资源场景 × AI 产品',
    summary: '职位页提到 Agent 研发平台、工作流编排和 AI 产品生命周期管理。',
    sourceUrl: 'https://www.zhipin.com/job_detail/faa59b8168d6fbb00nJ509i0EVJR.html',
    capturedAt: '2026-10-13',
  },
  {
    platform: 'BOSS直聘',
    title: 'AI 产品经理',
    organization: '平安银行',
    location: '上海·普陀',
    salary: '20–35K/月',
    requirements: '3–5 年 · 本科',
    connection: '金融服务 × 智能办公与知识管理',
    summary: '职位页聚焦会议转写、智能办公和知识管理产品。',
    sourceUrl: 'https://www.zhipin.com/job_detail/eff94f8e8a1617eb0nJ40tq0GVpY.html',
    capturedAt: '2026-10-13',
  },
  {
    platform: 'BOSS直聘',
    title: 'AI 编辑（人工智能）',
    organization: '极客邦科技 / InfoQ',
    location: '北京·朝阳',
    salary: '17–25K/月',
    requirements: '3–5 年 · 本科',
    connection: '科技传播与编辑 × AI',
    summary: '职位页包含 AI 技术动态报道、选题策划和内容编辑工作。',
    sourceUrl: 'https://www.zhipin.com/job_detail/df5f214f99f02f6f0nJ709W5FlRX.html',
    capturedAt: '2026-10-13',
  },
  {
    platform: '猎聘',
    title: 'AI 产品经理',
    organization: '同道猎聘集团',
    location: '北京·朝阳',
    salary: '28–35K · 14 薪',
    requirements: '3 年以上 · 本科',
    connection: '招聘服务 × 大模型产品化',
    summary: '职位页提到提示词设计、生成效果评估与产品迭代。',
    sourceUrl: 'https://www.liepin.com/job/1974855567.shtml',
    capturedAt: '2026-10-13',
  },
];

export const platformChannels = [
  {
    name: 'BOSS直聘',
    description: '可从 AI 产品经理列表继续查看 Agent、金融、医疗等应用方向。',
    query: 'AI 产品经理',
    url: 'https://www.zhipin.com/zhaopin/904d936bb2f094f90XB62d26/',
  },
  {
    name: '猎聘',
    description: '查看人工智能岗位与中高端产品、算法及行业应用职位。',
    query: '人工智能 / 大模型',
    url: 'https://www.liepin.com/s/711ff988c3dc6c5731a62b9052eabce6/',
  },
  {
    name: '智联招聘',
    description: '直接搜索 AI 产品、人工智能工程师、数据标注等岗位。',
    query: 'AI 产品经理',
    url: 'https://www.zhaopin.com/position/AIchanpinjingli/',
  },
  {
    name: '前程无忧 51job',
    description: '在站内按城市和关键词检索 AI、数据、智能制造等职位。',
    query: 'AI / 数据 / 智能制造',
    url: 'https://www.51job.com/',
  },
];

export const marketReport = {
  title: '智联招聘《2026年人工智能产业人才发展报告》',
  publisher: '经济网报道',
  publishedAt: '2026-07-17',
  url: 'https://www.ceweekly.cn/economic/industry/2026/0717/497479.html',
  metrics: [
    { value: '+24.8%', label: 'AI 行业招聘企业数', detail: '2026 上半年同比' },
    { value: '+10.6%', label: 'AI 行业招聘职位数', detail: '2026 上半年同比' },
    { value: '+87.7%', label: 'AI 产品经理职位数', detail: '2026 上半年同比' },
    { value: '+19.3%', label: '人工智能工程师职位数', detail: '2026 上半年同比' },
  ],
};
