export const REGIONS = ['北京', '上海', '广东', '浙江', '江苏', '其他地区'] as const;

export const ZHEJIANG_CITIES = ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'];
export const JIANGSU_CITIES = ['南京', '苏州', '无锡', '常州', '镇江', '南通', '泰州', '扬州', '盐城', '连云港', '淮安', '宿迁', '徐州'];

export const DISCIPLINES = [
  { id: 'ai-humanities', name: '人工智能×人文社会科学', primary: '人工智能', secondary: '人文社会科学', roles: ['AI治理', '科技伦理', '社会计算', '计算传播'], keywords: ['伦理', '治理', '政策'] },
  { id: 'data-social', name: '数据科学×社会科学', primary: '数据科学', secondary: '社会科学', roles: ['计算社会科学', '政策分析', '数字经济', '量化研究'], keywords: ['计量', '统计', '数据'] },
  { id: 'cs-psych', name: '计算机×心理学／认知科学', primary: '计算机', secondary: '心理学／认知科学', roles: ['人机交互', '用户研究', '认知建模'], keywords: ['HCI', 'UX', '认知'] },
  { id: 'eng-design', name: '工程×设计／艺术', primary: '工程', secondary: '设计／艺术', roles: ['交互设计', '数字媒体', '创意技术'], keywords: ['设计', '交互', '创意'] },
  { id: 'med-cs', name: '医学／生命科学×计算机', primary: '医学／生命科学', secondary: '计算机', roles: ['医疗AI', '生物信息学', '脑机接口'], keywords: ['医疗', '生物', '神经'] },
  { id: 'law-tech', name: '法学／公共管理×技术', primary: '法学／公共管理', secondary: '技术', roles: ['数据治理', '隐私保护', '科技政策'], keywords: ['合规', '隐私', '政策'] },
  { id: 'geo-data', name: '地理／环境×数据技术', primary: '地理／环境', secondary: '数据技术', roles: ['城市计算', '空间分析', '环境政策'], keywords: ['GIS', '空间', '城市'] },
  { id: 'eng-materials', name: '工程×材料／能源', primary: '工程', secondary: '材料／能源', roles: ['新能源', '先进材料', '智能制造'], keywords: ['材料', '能源', '电池'] },
  { id: 'phil-social', name: '哲学×社会科学', primary: '哲学', secondary: '社会科学', roles: ['科学技术哲学', '马克思主义理论', '思政教育', '人文通识'], keywords: ['哲学', '伦理', '马克思主义', '人文'] },
  { id: 'robotics-sim', name: '机器人×仿真算法', primary: '机器人', secondary: '仿真算法', roles: ['具身智能', '世界模型', 'Sim2Real', '仿真引擎'], keywords: ['VLA', '强化学习', '物理仿真', '数字孪生'] },
];

export const ORG_TYPES = ['高校', '科研院所', '企业', '事业单位', '其他'] as const;
export const JOB_TYPES = ['科研', '教学', '工程', '产品', '政策研究', '产业研究', '管理'] as const;
export const EDUCATION_LEVELS = ['本科', '硕士', '博士'] as const;
export const JOB_STATUSES = ['招聘中', '已截止', '状态待核实'] as const;

export type ListingKind = '具体岗位' | '招聘项目' | '招聘公告';

export function getListingKind(title: string): ListingKind {
  if (/校招|校园招聘|管理培训生|人才计划|顶尖人才计划/.test(title)) {
    return '招聘项目';
  }

  if (
    /公开招聘|统一公开招聘|集中公开招聘|年度招聘|招聘工作人员|招聘专业技术|招聘专技|事业单位自主招聘|高层次专业技术人才招聘|^20\d{2}招聘/.test(title)
  ) {
    return '招聘公告';
  }

  return '具体岗位';
}
