import type { Job } from '../lib/types';

// These roles are explicitly named in current multi-role recruitment notices.
// Keep them as source-checked leads until each employer's individual position
// page is separately captured; do not infer requirements or responsibilities.
function sourceLead(
  id: number,
  title: string,
  organization: string,
  province: string,
  location: string,
  sourceName: string,
  sourceUrl: string,
  sourceTitle: string,
  publishedAt: string,
): Job {
  return {
    id, title, organization, province, city: '多地', location,
    org_type: '其他', job_type: '待核实',
    original_major_requirements: '', platform_disciplines: [], required_skills: [], preferred_skills: [],
    education: '', experience: '', salary: null, description: '', responsibilities: '', application_info: '',
    published_at: publishedAt, deadline: null,
    source_name: sourceName, source_type: '其他', source_url: sourceUrl,
    fetched_at: '2026-10-15', last_verified: '2026-10-15', status: '状态待核实', is_demo: false,
    recruit_type: '校招', verification_level: '来源核验', source_title: sourceTitle,
    source_evidence: [sourceTitle, organization, title],
  };
}

const expandedSourceLeads: Job[] = [
  // 中国移动：北京、上海、江苏、浙江、广东
  sourceLead(1001, '通信网络工程师', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1002, '网络信息安全工程师', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1003, '智算开发工程师', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1004, '云计算工程师', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1005, '大数据工程师', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1006, 'AI大模型算法工程师', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1007, 'AI架构师', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1008, 'AI产品经理', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1009, '政企客户经理', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1010, '市场运营', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1011, '渠道管理', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1012, '营销策划', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1013, '财务管理', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1014, '法律合规管理', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1015, '人力资源管理', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),
  sourceLead(1016, '综合管理', '中国移动通信有限公司', '北京、上海、江苏、浙江、广东', '北京市 / 上海市 / 江苏省 / 浙江省 / 广东省', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/118222.html', '中国移动2027校园招聘全面启动！', '2026-09-09'),

  // 平安科技：深圳及广东
  sourceLead(1017, '算法工程师', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1018, '算法工程师 (NLP)', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1019, '算法工程师 (数据挖掘)', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1020, '算法工程师 (视觉)', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1021, '数据分析师', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1022, '算法工程师 (语音)', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1023, '运维工程师', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1024, '前端开发', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1025, '后端开发工程师', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1026, '安全工程师', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1027, '产品经理', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1028, '项目管理', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1029, '税务管理', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1030, '行政', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1031, '人力资源管理', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1032, '设计师', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1033, '运营管理', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),
  sourceLead(1034, '经营分析', '平安科技（深圳）有限公司', '广东', '广东省 / 深圳', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117635.html', '平安科技2027届全球校园招聘正式', '2026-09-03'),

  // 安克创新：江浙沪、北京、广东的岗位类别
  sourceLead(1035, '采购与供应链类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),
  sourceLead(1036, '产品与体验类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),
  sourceLead(1037, '品质类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),
  sourceLead(1038, '设计类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),
  sourceLead(1039, '市场营销类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),
  sourceLead(1040, '数据开发类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),
  sourceLead(1041, '研发技术类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),
  sourceLead(1042, '职能类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),
  sourceLead(1043, '制造类', '安克创新科技股份有限公司', '北京、上海、江苏、浙江、广东', '深圳、长沙、北京、苏州、上海、杭州、西安等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/116865.html', '安克创新2027届全球校园招聘简章', '2026-08-21'),

  // 新紫光：北京、上海、天津、深圳、广州、杭州、南京、无锡等
  sourceLead(1044, '测试开发工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1045, '软件测试工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1046, '测试设计工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1047, '交付质量工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1048, '失效分析工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1049, '封装设计工程师（工艺分析/新产品导入方向）', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1050, '封装设计工程师（封装设计方向）', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1051, '工艺技术员', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1052, 'PMC工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1053, '功能安全工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1054, '销售工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1055, '产品经理', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1056, '产品管理工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1057, '国内电商运营', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1058, '技术支持工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1059, '应用工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1060, '系统工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1061, 'FPGA应用开发工程师', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1062, '人力资源管培生/储备干部', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
  sourceLead(1063, '项目管理', '新紫光集团有限公司', '北京、上海、天津、广东、浙江、江苏', '北京、上海、天津、深圳、珠海、广州、杭州、南京、无锡等', '南开大学就业信息网（转载）', 'https://career.nankai.edu.cn/correcruit/content/id/117217.html', '新紫光集团下属产业公司 2027届校园招聘简章', '2026-08-31'),
];

export default expandedSourceLeads;
