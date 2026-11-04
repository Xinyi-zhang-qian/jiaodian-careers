export interface Job {
  id: number;
  title: string;
  organization: string;
  province: string;
  city: string;
  location: string;
  org_type: '高校' | '科研院所' | '企业' | '事业单位' | '其他';
  job_type: string;
  original_major_requirements: string;
  platform_disciplines: string[];
  required_skills: string[];
  preferred_skills: string[];
  education: string;
  experience: string;
  salary: string | null;
  description: string;
  responsibilities: string;
  application_info: string;
  published_at: string;
  deadline: string | null;
  source_name: string;
  source_type: '官网' | '政府' | '其他';
  source_url: string;
  fetched_at: string;
  last_verified: string;
  status: '招聘中' | '已截止' | '状态待核实';
  is_demo: boolean;
  recruit_type?: '校招' | '社招';
  verification_level?: '待核实' | '关键字段核验' | '来源核验' | '逐字段核验';
  source_title?: string;
  source_evidence?: string[];
  // 桩成员：与 data-foundation 分支的定义保持一致——application_opens_at 为报名开始日期
  // （YYYY-MM-DD，可空），job_functions 为平台职能标签数组；合并时以 data-foundation 版本为准。
  application_opens_at?: string;
  job_functions?: string[];
}

export interface Discipline {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  roles: string[];
  keywords: string[];
}

export type SourceType = '官网' | '政府' | '其他';
export type OrgType = '高校' | '科研院所' | '企业' | '事业单位' | '其他';
export type JobStatus = '招聘中' | '已截止' | '状态待核实';
export type Region = '北京' | '上海' | '广州' | '浙江' | '江苏' | '其他地区';
