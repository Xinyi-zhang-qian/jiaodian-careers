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
// 处置记录（2026-11-04 ::mergelocal）：原 QUARANTINED 平台快照段（4 条，未保存逐字段原文证据）
// 经 recheck:legacy 复核后整体移除，不再作为任何展示数据保留。

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
