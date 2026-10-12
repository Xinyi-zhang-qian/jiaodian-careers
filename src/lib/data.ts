import { Job } from './types';
import realJobs from '../data/real-jobs';

// All demo data — stored in-memory, no database needed for v1
const demoJobs: Job[] = [
  {
    id: 1, title: 'AI治理研究员', organization: '明理人工智能研究院',
    province: '北京', city: '北京', location: '北京市海淀区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '哲学、伦理学、法学、计算机科学或相关专业硕士及以上',
    platform_disciplines: ['人工智能×人文社会科学'],
    required_skills: ['科技伦理', 'AI治理', '政策分析'],
    preferred_skills: ['有SCI/SSCI发表经验者优先'],
    education: '硕士', experience: '不限', salary: '25-40k·14薪',
    description: '本院拟招聘AI治理方向研究员1-2名，参与国家科技伦理治理相关课题研究。',
    responsibilities: '1. 开展AI伦理与治理相关研究\n2. 参与政策咨询报告撰写\n3. 组织学术研讨会',
    application_info: '请将简历、代表作发送至 hr@example-institute.cn',
    published_at: '2026-01-15', deadline: '2026-02-15',
    source_name: '明理人工智能研究院官网', source_type: '官网', source_url: 'https://example-institute.cn/careers/ai-governance',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
    recruit_type: '社招',
  },
  {
    id: 2, title: '计算社会科学博士后', organization: '华东社会计算研究中心',
    province: '上海', city: '上海', location: '上海市杨浦区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '社会学、计算机科学、数据科学或相关专业博士',
    platform_disciplines: ['数据科学×社会科学', '人工智能×人文社会科学'],
    required_skills: ['Python', '机器学习', '社会网络分析'],
    preferred_skills: ['有NLP经验者优先'],
    education: '博士', experience: '应届博士', salary: '30-45k·12薪',
    description: '中心面向计算社会科学前沿，招聘博士后2名。',
    responsibilities: '1. 开展计算社会科学研究\n2. 申请科研基金\n3. 指导研究生',
    application_info: '详情请见官网招聘公告',
    published_at: '2026-01-15', deadline: '2026-03-01',
    source_name: '华东社会计算研究中心', source_type: '官网', source_url: 'https://example-scc.cn/postdoc',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 3, title: '数字经济政策研究员', organization: '长三角发展研究院',
    province: '浙江', city: '杭州', location: '杭州市西湖区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '经济学、公共政策、统计学或相关专业硕士及以上',
    platform_disciplines: ['数据科学×社会科学'],
    required_skills: ['计量经济学', 'Stata/R', '政策分析'],
    preferred_skills: ['有政府智库工作经验者优先'],
    education: '硕士', experience: '3年以上相关经验', salary: '20-35k·13薪',
    description: '研究院聚焦数字经济与区域发展，招聘政策研究员。',
    responsibilities: '1. 数字经济政策研究\n2. 撰写研究报告\n3. 参与政府咨询项目',
    application_info: '请将材料发送至 hr@example-dev.cn',
    published_at: '2026-01-15', deadline: '2026-02-28',
    source_name: '长三角发展研究院', source_type: '官网', source_url: 'https://example-dev.cn/jobs/policy',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 4, title: '人机交互研究员（用户研究方向）', organization: '智行科技有限公司',
    province: '北京', city: '北京', location: '北京市朝阳区',
    org_type: '企业', job_type: '科研',
    original_major_requirements: '心理学、认知科学、人机交互或相关专业硕士及以上',
    platform_disciplines: ['计算机×心理学／认知科学'],
    required_skills: ['用户研究', '实验设计', '数据分析'],
    preferred_skills: ['有互联网产品UX研究经验者优先'],
    education: '硕士', experience: '2年以上用户研究经验', salary: '30-50k·15薪',
    description: '智行科技用户研究团队招聘研究员，负责核心产品体验优化。',
    responsibilities: '1. 设计并执行用户研究\n2. 输出研究报告与设计建议\n3. 与产品团队协作',
    application_info: '请通过官网投递',
    published_at: '2026-01-15', deadline: '2026-03-15',
    source_name: '智行科技有限公司招聘官网', source_type: '官网', source_url: 'https://example-zhixing.com/careers/ux',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 5, title: '交互设计讲师', organization: '东方创意科技学院',
    province: '江苏', city: '南京', location: '南京市鼓楼区',
    org_type: '高校', job_type: '教学',
    original_major_requirements: '交互设计、数字媒体艺术、工业设计或相关专业硕士及以上',
    platform_disciplines: ['工程×设计／艺术'],
    required_skills: ['交互设计', '原型工具', '设计思维'],
    preferred_skills: ['有海外学习或行业经验者优先'],
    education: '硕士', experience: '不限', salary: '15-25k·12薪',
    description: '学院设计系招聘讲师，承担交互设计课程教学。',
    responsibilities: '1. 承担本科生交互设计课程\n2. 指导学生项目\n3. 参与学科建设',
    application_info: '详见学院招聘公告',
    published_at: '2026-01-15', deadline: '2026-04-01',
    source_name: '东方创意科技学院人事处', source_type: '官网', source_url: 'https://example-art-college.cn/hr',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 6, title: '脑机接口算法工程师', organization: '脑智科技有限公司',
    province: '上海', city: '上海', location: '上海市浦东新区',
    org_type: '企业', job_type: '工程',
    original_major_requirements: '生物医学工程、计算机科学、神经科学或相关专业硕士及以上',
    platform_disciplines: ['医学／生命科学×计算机'],
    required_skills: ['信号处理', 'Python', '机器学习', '神经科学基础'],
    preferred_skills: ['有BCI项目经验者优先'],
    education: '硕士', experience: '2年以上算法经验', salary: '35-55k·14薪',
    description: '公司聚焦脑机接口技术，招聘算法工程师。',
    responsibilities: '1. 脑电信号处理算法开发\n2. 模型优化与部署\n3. 论文与专利撰写',
    application_info: '请将简历发送至 careers@example-brain.cn',
    published_at: '2026-01-15', deadline: '2026-03-10',
    source_name: '脑智科技有限公司', source_type: '官网', source_url: 'https://example-brain.cn/jobs/bci',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 7, title: '数据合规研究员', organization: '中政数据治理研究院',
    province: '北京', city: '北京', location: '北京市西城区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '法学、公共管理、信息安全或相关专业硕士及以上',
    platform_disciplines: ['法学／公共管理×技术'],
    required_skills: ['数据治理', '隐私保护', '法律研究'],
    preferred_skills: ['通过法律职业资格考试者优先'],
    education: '硕士', experience: '1年以上相关经验', salary: '20-30k·13薪',
    description: '研究院从事数据治理与合规研究，招聘研究员。',
    responsibilities: '1. 数据合规政策研究\n2. 企业合规咨询\n3. 撰写研究报告',
    application_info: '详见官网',
    published_at: '2026-01-15', deadline: '2026-02-20',
    source_name: '中政数据治理研究院', source_type: '官网', source_url: 'https://example-law-inst.cn/careers',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 8, title: '城市计算研究员', organization: '智慧城市空间信息实验室',
    province: '江苏', city: '苏州', location: '苏州市工业园区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '地理信息系统、计算机科学、城市规划或相关专业硕士及以上',
    platform_disciplines: ['地理／环境×数据技术'],
    required_skills: ['空间分析', 'Python', 'GIS', '城市数据'],
    preferred_skills: ['有智慧城市项目经验者优先'],
    education: '硕士', experience: '不限', salary: '18-30k·13薪',
    description: '实验室聚焦城市计算与空间智能，招聘研究员。',
    responsibilities: '1. 城市数据分析与建模\n2. 空间算法开发\n3. 论文发表',
    application_info: '请联系实验室负责人',
    published_at: '2026-01-15', deadline: '2026-03-20',
    source_name: '智慧城市空间信息实验室', source_type: '官网', source_url: 'https://example-spatial.cn/join',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 9, title: '科技哲学副教授', organization: '燕京文理学院',
    province: '北京', city: '北京', location: '北京市海淀区',
    org_type: '高校', job_type: '教学',
    original_major_requirements: '哲学（科技哲学方向）博士',
    platform_disciplines: ['人工智能×人文社会科学'],
    required_skills: ['科技哲学', '伦理学', '学术研究'],
    preferred_skills: ['有海外访学经历者优先'],
    education: '博士', experience: '不限', salary: '25-40k·12薪',
    description: '学院哲学系招聘科技哲学方向副教授。',
    responsibilities: '1. 承担本科生与研究生教学\n2. 开展学术研究\n3. 参与学科建设',
    application_info: '详见人事处公告',
    published_at: '2026-01-15', deadline: '2026-05-01',
    source_name: '燕京文理学院人事处', source_type: '官网', source_url: 'https://example-yjcollege.cn/hr',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 10, title: '社会政策研究员', organization: '首都公共政策研究院',
    province: '北京', city: '北京', location: '北京市东城区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '社会学、公共管理、经济学或相关专业硕士及以上',
    platform_disciplines: ['数据科学×社会科学'],
    required_skills: ['社会调查', '统计分析', '政策写作'],
    preferred_skills: ['有政府工作经验者优先'],
    education: '硕士', experience: '3年以上', salary: '18-28k·13薪',
    description: '研究院招聘社会政策研究员，参与民生政策研究。',
    responsibilities: '1. 社会政策调研\n2. 撰写政策报告\n3. 参与学术会议',
    application_info: '请将材料发送至 hr@example-policy.cn',
    published_at: '2026-01-15', deadline: '2026-02-25',
    source_name: '首都公共政策研究院', source_type: '官网', source_url: 'https://example-policy.cn/jobs',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 11, title: 'AI伦理审查专员', organization: '粤科人工智能研究院',
    province: '广东', city: '广州', location: '广州市天河区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '伦理学、法学、哲学或相关专业硕士及以上',
    platform_disciplines: ['人工智能×人文社会科学'],
    required_skills: ['科技伦理', '审查评估', '法律合规'],
    preferred_skills: ['有伦理审查经验者优先'],
    education: '硕士', experience: '1年以上', salary: '15-25k·13薪',
    description: '研究院设立AI伦理委员会，招聘审查专员。',
    responsibilities: '1. AI项目伦理审查\n2. 制定审查标准\n3. 培训与咨询',
    application_info: '详见招聘公告',
    published_at: '2026-01-15', deadline: '2026-03-05',
    source_name: '粤科人工智能研究院', source_type: '官网', source_url: 'https://example-yueke.cn/ethics-careers',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 12, title: '数字人文研究员', organization: '之江数字人文研究院',
    province: '浙江', city: '杭州', location: '杭州市余杭区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '历史学、计算机科学、数字人文或相关专业硕士及以上',
    platform_disciplines: ['数据科学×社会科学', '计算机×心理学／认知科学'],
    required_skills: ['文本挖掘', 'NLP', '数字人文'],
    preferred_skills: ['有数字人文项目经验者优先'],
    education: '硕士', experience: '不限', salary: '20-35k·12薪',
    description: '研究院致力于数字人文前沿研究。',
    responsibilities: '1. 文本数据挖掘与分析\n2. 数字人文平台开发\n3. 学术论文发表',
    application_info: '请联系研究院',
    published_at: '2026-01-15', deadline: '2026-03-12',
    source_name: '之江数字人文研究院', source_type: '官网', source_url: 'https://example-zjdh.cn',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 13, title: '认知科学实验师', organization: '金陵认知科学研究院',
    province: '江苏', city: '南京', location: '南京市栖霞区',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '心理学、认知神经科学或相关专业硕士及以上',
    platform_disciplines: ['计算机×心理学／认知科学'],
    required_skills: ['实验设计', 'EEG/fMRI', '数据分析'],
    preferred_skills: ['有脑成像分析经验者优先'],
    education: '硕士', experience: '2年以上', salary: '18-28k·12薪',
    description: '实验室招聘实验师，负责认知实验平台运营。',
    responsibilities: '1. 实验平台管理与维护\n2. 协助实验设计与数据采集\n3. 数据分析',
    application_info: '详见招聘公告',
    published_at: '2026-01-15', deadline: '2026-03-08',
    source_name: '金陵认知科学研究院', source_type: '官网', source_url: 'https://example-jl-cog.cn/jobs',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '招聘中', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 14, title: 'AI产品经理（教育方向）', organization: '慧学科技有限公司',
    province: '北京', city: '北京', location: '北京市海淀区',
    org_type: '企业', job_type: '产品',
    original_major_requirements: '教育学、计算机科学、心理学或相关专业硕士及以上',
    platform_disciplines: ['人工智能×人文社会科学', '计算机×心理学／认知科学'],
    required_skills: ['产品设计', '用户研究', '数据分析'],
    preferred_skills: ['有教育科技产品经验者优先'],
    education: '硕士', experience: '3年以上产品经验', salary: '35-55k·15薪',
    description: '慧学教育招聘AI产品经理。',
    responsibilities: '1. AI教育产品规划与设计\n2. 用户需求分析\n3. 跨团队协作',
    application_info: '请通过官网投递',
    published_at: '2025-12-01', deadline: '2026-01-15',
    source_name: '慧学科技有限公司', source_type: '官网', source_url: 'https://example-huixue.cn/pm',
    fetched_at: '2025-12-01', last_verified: '2026-01-16', status: '已截止', is_demo: true,
    recruit_type: '社招',
  },
  {
    id: 15, title: '产业分析师（新能源方向）', organization: '远景产业研究院',
    province: '浙江', city: '宁波', location: '宁波市鄞州区',
    org_type: '企业', job_type: '科研',
    original_major_requirements: '经济学、环境科学、工程管理或相关专业硕士及以上',
    platform_disciplines: ['数据科学×社会科学', '地理／环境×数据技术'],
    required_skills: ['产业研究', '数据分析', '报告撰写'],
    preferred_skills: ['有新能源行业经验者优先'],
    education: '硕士', experience: '2年以上', salary: '20-35k·13薪',
    description: '研究院招聘产业分析师。',
    responsibilities: '1. 新能源产业研究\n2. 行业报告撰写\n3. 客户咨询',
    application_info: '详见招聘公告',
    published_at: '2026-01-15', deadline: null,
    source_name: '远景产业研究院', source_type: '其他', source_url: 'https://example-yuanjing.cn',
    fetched_at: '2026-01-15', last_verified: '2026-01-15', status: '状态待核实', is_demo: true,
    recruit_type: '社招',
  },
];

// Merge real + demo jobs
const allJobs: Job[] = [...realJobs, ...demoJobs];

export function getJobs(filters: {
  region?: string;
  city?: string;
  org_type?: string;
  job_type?: string;
  education?: string;
  primary_discipline?: string;
  secondary_discipline?: string;
  status?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'verified' | 'deadline';
} = {}) {
  let result = [...allJobs];

  if (filters.region && filters.region !== '其他地区') {
    result = result.filter(j => j.province === filters.region);
  } else if (filters.region === '其他地区') {
    result = result.filter(j => !['北京', '上海', '广东', '浙江', '江苏'].includes(j.province));
  }

  if (filters.city) result = result.filter(j => j.city === filters.city);
  if (filters.org_type) result = result.filter(j => j.org_type === filters.org_type);
  if (filters.job_type) result = result.filter(j => j.job_type === filters.job_type);
  if (filters.education) result = result.filter(j => j.education === filters.education);
  if (filters.primary_discipline) result = result.filter(j => j.platform_disciplines.includes(filters.primary_discipline!));
  if (filters.secondary_discipline) {
    const kw = filters.secondary_discipline.toLowerCase();
    result = result.filter(j =>
      j.platform_disciplines.some(d => d.toLowerCase().includes(kw)) ||
      j.required_skills.some(s => s.toLowerCase().includes(kw)) ||
      j.preferred_skills.some(s => s.toLowerCase().includes(kw))
    );
  }
  if (filters.status) result = result.filter(j => j.status === filters.status);
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    result = result.filter(j =>
      j.title.toLowerCase().includes(kw) ||
      j.organization.toLowerCase().includes(kw) ||
      j.original_major_requirements.toLowerCase().includes(kw) ||
      j.description.toLowerCase().includes(kw)
    );
  }

  // Sort
  if (filters.sort === 'verified') {
    result.sort((a, b) => b.last_verified.localeCompare(a.last_verified));
  } else if (filters.sort === 'deadline') {
    result.sort((a, b) => {
      const da = a.deadline || '9999-12-31';
      const db = b.deadline || '9999-12-31';
      return da.localeCompare(db);
    });
  } else {
    result.sort((a, b) => b.published_at.localeCompare(a.published_at));
  }

  const total = result.length;
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const pagedJobs = result.slice(start, start + limit);

  return { jobs: pagedJobs, total, totalPages, page };
}

export function getJob(id: number): Job | null {
  return allJobs.find(j => j.id === id) || null;
}

export function getJobCountByDiscipline(discipline: string): number {
  return allJobs.filter(j => j.platform_disciplines.includes(discipline)).length;
}

export function getDistinctCities(province: string): string[] {
  return [...new Set(allJobs.filter(j => j.province === province && j.city).map(j => j.city))].sort();
}
