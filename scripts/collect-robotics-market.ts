import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import realJobs from '../src/data/real-jobs';
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

type Seed = Omit<RoboticsMarketJob, 'direction' | 'normalizedSalary' | 'verifiedAt' | 'sourceStatus' | 'httpStatus'>;
type SourceCheck = Pick<RoboticsMarketJob, 'sourceStatus' | 'httpStatus'>;

const bossRobotAlgorithmUrl = 'https://www.zhipin.com/zhaopin/75010dd316a5690503J83tS0/';
const bossVlaUrl = 'https://www.zhipin.com/zhaopin/50cd2e307388e6bd33xz0tu-/';
const bossVlaCompanyUrl = 'https://www.zhipin.com/zhaopin/ebf41c3315eb7f8d1Xx80967GA~~/';
const bossRobotModelUrl = 'https://www.zhipin.com/zhaopin/58706ec48f108c9f33Zz3dW6/';
const bossControlUrl = 'https://www.zhipin.com/zhaopin/31d3f534ce06d3441nN63tm7FA~~/';
const bossHangzhouSlamUrl = 'https://m.zhipin.com/zhaopin/c43db07a1b5bf70303Zz29y4/';
const bossShenzhenSlamUrl = 'https://www.zhipin.com/zhaopin/197659aa2c7730131X1y0tq0Fg~~/';

function platformJob(
  id: string,
  title: string,
  organization: string,
  city: string,
  salary: string,
  education: string,
  experience: string,
  requirements: string,
  skills: string[],
  sourceName: 'BOSS直聘' | '猎聘',
  sourceUrl: string,
  recruitmentType: RoboticsRecruitmentType = '社招',
): Seed {
  return {
    id: `platform-${id}`,
    title,
    organization,
    city,
    location: city,
    recruitmentType,
    salary,
    education,
    experience,
    requirements,
    skills,
    summary: requirements,
    sourceName,
    sourceType: '招聘平台',
    sourceUrl,
    capturedAt: today,
  };
}

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

const expandedPlatformJobs: Seed[] = [
  platformJob('santai-algorithm', '机器人算法工程师', '三泰科技', '常州', '20–30K', '硕士', '3–5年', '研发机器人感知、规划与控制算法，完成真机验证。', ['机器人算法', '规划', '控制', 'C++'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('xinchengkong-algorithm', '机器人算法工程师', '日照新橙空', '青岛', '15–25K', '本科', '5–10年', '负责机器人定位、导航与运动控制算法开发。', ['SLAM', '导航', '运动控制'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('minth-robot-algorithm', '机器人算法工程师', '敏实集团', '宁波', '15–30K·15薪', '硕士', '应届生', '开发机器人强化学习、模仿学习与 VLA 算法。', ['VLA', '强化学习', '模仿学习'], 'BOSS直聘', bossRobotAlgorithmUrl, '校招'),
  platformJob('ape-algorithm', '机器人算法工程师', 'APE', '苏州', '12–20K', '本科', '1–3年', '开发工业机器人规划与控制算法。', ['路径规划', '运动控制', 'C++'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('mayi-algorithm', '机器人算法工程师', '蚂蚁机器人', '青岛', '18–25K', '本科', '3–5年', '负责移动机器人感知、定位和导航算法。', ['SLAM', '感知', '导航'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('huirui-campus', '机器人算法工程师', '重庆慧睿', '重庆', '6–9K', '本科', '应届生', '参与机器人算法研发、调试与测试。', ['机器人算法', 'Python', '测试'], 'BOSS直聘', bossRobotAlgorithmUrl, '校招'),
  platformJob('hongshengda-algorithm', '机器人算法工程师', '宏圣达', '廊坊', '24–45K', '硕士', '1–3年', '研发机器人运动规划、控制与学习算法。', ['运动规划', '运动控制', '强化学习'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('wattman-3d', '机器人算法工程师（3D 感知）', '瓦特曼', '北京', '16–30K', '硕士', '1–3年', '负责点云处理、3D 目标感知与机器人场景理解。', ['3D感知', '点云', '目标检测'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('deti-algorithm', '机器人算法工程师', '得体科技', '杭州', '20–30K', '硕士', '1–3年', '开发机器人感知、规划与控制模块。', ['机器人感知', '路径规划', '控制'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('sharpa-vlm', '机器人算法工程师（VLM）', 'Sharpa', '上海', '40–70K·16薪', '硕士', '3–5年', '研发视觉语言模型并用于机器人感知和操作。', ['VLM', '多模态大模型', '机器人操作'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('zhongguan-path', '3D 机器人路径规划算法工程师', '中观自动化', '武汉', '20–35K·14薪', '硕士', '1–3年', '开发机械臂三维路径规划、避障和轨迹优化算法。', ['3D路径规划', '避障', '轨迹优化'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('lingxin-grasp', '机器人算法工程师（抓取规划）', '灵心巧手', '北京', '20–40K·13薪', '本科', '3–5年', '开发 RGB-D 感知、姿态估计与机器人抓取规划算法。', ['RGB-D', '抓取规划', '姿态估计'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('geekplus-control', '机器人控制与规划算法工程师', '极智嘉', '北京', '25–50K·15薪', '硕士', '3–5年', '负责机器人运动控制、路径规划和系统工程化。', ['运动控制', '路径规划', 'C++'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('bangtai-algorithm', '机器人算法工程师', '安徽邦泰', '合肥', '25–35K', '本科', '1–3年', '开发机器人导航、感知和控制算法。', ['SLAM', '导航', '控制'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('medical-robot-algorithm', '医疗机器人算法工程师', '深度医疗', '东莞', '11–18K', '硕士', '经验不限', '研发医疗机器人视觉感知和运动控制算法。', ['机器视觉', '运动控制', '医疗机器人'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('jdlogistics-algorithm', '机器人算法工程师', '京东物流', '北京', '20–40K·19薪', '本科', '5–10年', '研发物流机器人定位、调度、规划与控制算法。', ['物流机器人', '路径规划', '调度算法'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('siasun-algorithm', '机器人算法工程师', '沈阳新松', '沈阳', '12–20K·13薪', '硕士', '5–10年', '研发工业与移动机器人的规划控制算法。', ['工业机器人', '规划', '控制'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('xiaoheshineng-algorithm', '机器人算法工程师', '小核智能', '常州', '15–20K', '本科', '3–5年', '负责机器人感知、定位与导航算法。', ['SLAM', '导航', '感知'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('lingyi-algorithm', '机器人算法工程师', '领益精密', '东莞', '13–26K', '本科', '经验不限', '参与工业机器人视觉、路径规划与项目落地。', ['机器视觉', '路径规划', '工业自动化'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('xuanliang-algorithm', '机器人算法工程师', '旋量科技', '合肥', '12–20K', '本科', '1–3年', '研发机器人运动规划、感知与控制算法。', ['运动规划', '感知', '控制'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('nbii-dexterous', '灵巧操作控制算法工程师', '宁波工业互联网研究院', '绍兴', '25–35K', '硕士', '1–3年', '研发灵巧手、机械臂的运动控制与操作学习算法。', ['灵巧操作', '运动控制', '模仿学习'], 'BOSS直聘', bossRobotAlgorithmUrl),
  platformJob('baifeng-algorithm', '机器人算法工程师', '河北百丰', '保定', '8–13K', '本科', '1–3年', '负责机器人导航与运动控制算法调试。', ['导航', '运动控制', 'ROS'], 'BOSS直聘', bossRobotAlgorithmUrl),

  platformJob('zhuoshi-vla', 'VLA 具身智能研究员', '卓世科技', '北京', '30–60K', '硕士', '经验不限', '研究视觉—语言—动作模型，推进具身任务训练和部署。', ['VLA', '多模态大模型', '具身智能'], 'BOSS直聘', bossVlaUrl),
  platformJob('tencent-embodied-model', '机器人具身大模型算法工程师', '腾讯', '深圳', '50–70K', '硕士', '5–10年', '研发机器人多模态大模型、VLA 与具身决策算法。', ['VLA', '具身大模型', '多模态'], 'BOSS直聘', bossVlaUrl),
  platformJob('tuoyuan-vla', '具身智能算法研究员', '拓元智慧', '广州', '25–50K', '硕士', '经验不限', '研究多模态大模型、VLA 与机器人任务规划。', ['VLA', '多模态', '任务规划'], 'BOSS直聘', bossVlaUrl),
  platformJob('youai-vla', 'VLA 算法工程师', '优艾智合', '深圳', '40–60K·13薪', '硕士', '3–5年', '开发移动操作机器人的 VLA 模型训练、评测与部署链路。', ['VLA', '移动操作', '模型部署'], 'BOSS直聘', bossVlaCompanyUrl),
  platformJob('youai-software', '人形机器人软件工程师', '优艾智合', '深圳', '20–40K', '本科', '3–5年', '开发人形机器人中间件、通信、调度与系统集成能力。', ['ROS2', '机器人中间件', 'C++', '系统集成'], 'BOSS直聘', bossVlaCompanyUrl),
  platformJob('robotera-vla', 'VLA 具身大模型算法工程师', '星动纪元', '北京', '50–70K·15薪', '硕士', '经验不限', '研发人形机器人 VLA 大模型和操作策略。', ['VLA', '具身大模型', '机器人操作'], 'BOSS直聘', bossRobotModelUrl),
  platformJob('hyperion-robot-model', 'AI 大模型机器人控制算法工程师', '海伯利安', '武汉', '16–30K·14薪', '硕士', '经验不限', '将大模型与机器人决策、规划和控制结合。', ['大模型', '机器人控制', '决策规划'], 'BOSS直聘', bossRobotModelUrl),
  platformJob('bit-huahui-model', '机器人大模型算法工程师', '北京理工华汇', '北京', '30–40K·13薪', '本科', '3–5年', '研发机器人多模态理解、大模型决策与部署能力。', ['机器人大模型', '多模态', '模型部署'], 'BOSS直聘', bossRobotModelUrl),
  platformJob('yuanshen-control', '机器人控制算法工程师', '原身科技', '北京', '10–20K', '本科', '经验不限', '开发机器人运动学、动力学与控制算法。', ['运动学', '动力学', '运动控制'], 'BOSS直聘', bossControlUrl),
  platformJob('huiwen-middleware', '机器人中间件工程师', '北京慧闻', '惠州', '12–24K', '本科', '3–5年', '负责 ROS2 中间件、硬件抽象、通信与性能优化。', ['ROS2', '中间件', 'C++', '性能优化'], 'BOSS直聘', bossControlUrl),
  platformJob('peitian-3dvision', '机器人 3D 视觉算法工程师', '北京配天', '北京', '25–50K', '硕士', '1–3年', '研发机器人三维视觉、点云处理与姿态估计算法。', ['3D视觉', '点云', '姿态估计'], 'BOSS直聘', bossControlUrl),

  platformJob('jimu-slam', 'SLAM 算法工程师', '极目智控', '杭州', '25–45K', '本科', '3–5年', '开发移动机器人定位、建图与多传感器融合算法。', ['SLAM', '定位建图', '多传感器融合'], 'BOSS直聘', bossHangzhouSlamUrl),
  platformJob('huaxi-slam', '高级 SLAM 算法工程师', '骅羲智能', '杭州', '30–50K·15薪', '本科', '5–10年', '负责复杂场景激光或视觉 SLAM 算法与工程化。', ['SLAM', '激光雷达', '视觉定位'], 'BOSS直聘', bossHangzhouSlamUrl),
  platformJob('haosheng-slam', 'SLAM 算法工程师', '豪盛科技', '杭州', '25–40K·13薪', '本科', '3–5年', '开发机器人 SLAM、回环检测与定位优化算法。', ['SLAM', '回环检测', '定位优化'], 'BOSS直聘', bossHangzhouSlamUrl),
  platformJob('columbus-slam', 'SLAM 算法工程师', '哥仑布科技', '杭州', '23–35K', '本科', '3–5年', '开发移动机器人激光 SLAM 和导航算法。', ['激光SLAM', '导航', '移动机器人'], 'BOSS直聘', bossHangzhouSlamUrl),
  platformJob('mairui-slam', 'SLAM 算法工程师', '迈睿智能', '杭州', '20–40K', '本科', '3–5年', '研发机器人定位、建图、导航和避障算法。', ['SLAM', '导航', '避障'], 'BOSS直聘', bossHangzhouSlamUrl),
  platformJob('lanxin-slam', 'SLAM 算法工程师', '蓝芯科技', '杭州', '18–35K·13薪', '本科', '3–5年', '研发移动机器人的视觉定位、建图与导航。', ['视觉SLAM', '定位建图', '导航'], 'BOSS直聘', bossHangzhouSlamUrl),
  platformJob('thundersoft-slam', 'SLAM 算法专家', '中科创达', '杭州', '40–60K', '本科', '5–10年', '负责机器人 SLAM 算法方案、技术难点攻关和工程化。', ['SLAM', '多传感器融合', '算法工程化'], 'BOSS直聘', bossHangzhouSlamUrl),
  platformJob('lumi-slam', 'SLAM 算法工程师', '露米科技', '杭州', '30–50K·13薪', '本科', '3–5年', '研发家庭机器人定位、建图和环境感知算法。', ['SLAM', '环境感知', '家庭机器人'], 'BOSS直聘', bossHangzhouSlamUrl),
  platformJob('standardrobots-slam', 'SLAM 算法工程师', '斯坦德机器人', '深圳', '20–35K·15薪', '本科', '3–5年', '负责 AMR 激光 SLAM、定位与导航算法。', ['激光SLAM', 'AMR', '导航'], 'BOSS直聘', bossShenzhenSlamUrl),
  platformJob('sutpc-slam', 'SLAM 算法工程师', '深城交', '深圳', '30–50K·15薪', '硕士', '3–5年', '研发室外机器人多传感器定位建图算法。', ['SLAM', '多传感器融合', '室外定位'], 'BOSS直聘', bossShenzhenSlamUrl),
  platformJob('xuanji-slam', 'SLAM 算法工程师', '旋几工业机器人', '深圳', '30–50K·15薪', '硕士', '3–5年', '开发工业移动机器人的定位、建图与路径规划。', ['SLAM', '工业机器人', '路径规划'], 'BOSS直聘', bossShenzhenSlamUrl),

  platformJob('liepin-bhri-skill-learning', '技能学习算法工程师', '北京人形机器人创新中心', '北京', '30–50K·14薪', '硕士', '3–5年', '研发人形机器人强化学习、模仿学习和技能迁移算法。', ['强化学习', '模仿学习', '技能迁移'], '猎聘', 'https://www.liepin.com/job/1970080167.shtml'),
  platformJob('liepin-slam-director', 'SLAM 算法总监', '猎聘平台公开雇主', '西安', '40–70K·16薪', '硕士', '5–10年', '负责 SLAM 算法团队、技术路线与机器人定位建图交付。', ['SLAM', '技术管理', '定位建图'], '猎聘', 'https://www.liepin.com/job/1980018579.shtml'),
  platformJob('liepin-ant-simulation', '机器人仿真系统开发工程师', '蚂蚁集团', '上海', '35–65K·16薪', '本科', '3–5年', '开发机器人高保真仿真平台、传感器模型和训练评测工具链。', ['机器人仿真', '传感器模型', '评测平台'], '猎聘', 'https://www.liepin.com/job/1971802319.shtml'),
  platformJob('liepin-geekplus-training', '大模型分布式训练工程师', '极智嘉', '北京', '未公开', '硕士', '经验不限', '建设机器人大模型分布式训练、数据和评测基础设施。', ['大模型', '分布式训练', '数据工程'], '猎聘', 'https://www.liepin.com/job/1983965917.shtml', '校招'),
  platformJob('liepin-leju-rl', '强化学习运动控制算法工程师', '乐聚机器人', '北京', '30–60K·13薪', '硕士', '经验不限', '研发人形机器人强化学习运动控制、仿真训练与 Sim2Real。', ['强化学习', '运动控制', 'Sim2Real'], '猎聘', 'https://www.liepin.com/job/1984025401.shtml'),
  platformJob('liepin-kuling-perception', '3D 感知与控制算法工程师', '库状智能', '上海', '20–35K', '本科', '3–5年', '开发机器人三维感知、点云处理和操作控制算法。', ['3D感知', '点云', '操作控制'], '猎聘', 'https://www.liepin.com/job/1976177361.shtml'),
  platformJob('liepin-motion-control', '机器人运动控制算法工程师', '猎聘平台公开雇主', '北京', '35–65K·14薪', '硕士', '3–5年', '研发人形机器人运动学、动力学、轨迹规划与控制算法。', ['运动控制', '动力学', '轨迹规划'], '猎聘', 'https://www.liepin.com/job/1966653253.shtml'),
  platformJob('liepin-wuhan-simulation', '机器人仿真算法工程师', '猎聘平台公开雇主', '武汉', '20–30K·13薪', '博士', '3–5年', '研发机器人动力学仿真、控制策略验证与数字孪生模型。', ['机器人仿真', '动力学', '数字孪生'], '猎聘', 'https://www.liepin.com/job/1971367915.shtml'),
];

function inferSourceType(sourceName: string, organizationType?: string): RoboticsSourceType {
  if (/BOSS|猎聘|实习僧|聚合|牛客|学术桥|求职|招聘平台/i.test(sourceName)) return '招聘平台';
  if (/大学|研究院|研究所|实验室|高校|课题组/.test(organizationType ?? sourceName)) return '高校/研究机构';
  return '企业官网';
}

function inferRecruitmentType(title: string, recruitType?: string): RoboticsRecruitmentType {
  if (/博士后/.test(title)) return '博士后';
  if (/校招|应届|校园/.test(title) || recruitType === '校招') return '校招';
  return '社招';
}

function toSeeds(): Seed[] {
  const fullTimeSeeds: Seed[] = realJobs
    .filter((job) => (job.platform_disciplines.includes('机器人×仿真算法') || taggedJobIds.has(job.id))
      && !/实习/.test(job.title))
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

  return [...fullTimeSeeds, ...extraPublicJobs, ...expandedPlatformJobs];
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
    const html = response.ok ? await response.text() : '';
    const accessLimited = /请稍候|安全验证|访问受限|验证码|captcha/i.test(html);
    return {
      sourceStatus: response.ok && !accessLimited ? '可访问' as const : '受限或需复核' as const,
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
    scope: '全国机器人方向正式岗位公开样本（社招、校招与博士后），不包含任何实习岗位。来源覆盖企业官网、官方招聘系统、高校研究机构、BOSS直聘和猎聘公开页面。',
    methodology: [
      '只读取无需登录即可访问的公开页面，不绕过验证码、登录或访问限制。',
      '已排除标题或招聘类型为“实习”的记录；应届生可投的正式校招岗位保留。',
      '按“单位 + 岗位名称 + 城市”去重；同一岗位涉及多个方向时，按标题和主要交付物归入一个主方向。',
      '薪资只统计来源中明确公开的区间；月薪与日薪分开标准化，面议和未公开不参与薪资中位数。',
      'BOSS直聘与猎聘的结果会随个性化推荐、登录状态和下架变动，公开页也未稳定提供可复核的全国总数，因此页面只展示已采集去重样本数，不写成全国总岗位数或市场份额。',
    ],
    platformSearches: [
      {
        platform: 'BOSS直聘',
        query: '机器人算法 / VLA / 大模型 / 控制 / SLAM / 仿真',
        sourceUrl: bossRobotAlgorithmUrl,
        includedJobs: jobs.filter((job) => job.sourceName === 'BOSS直聘').length,
        note: '来自多个全国及城市公开检索页的可见正式岗位；不代表平台全量。',
      },
      {
        platform: '猎聘',
        query: '机器人 / SLAM / 仿真 / 运动控制 / 具身智能',
        sourceUrl: 'https://m.liepin.com/jobsjqrslamsfgcs/',
        includedJobs: jobs.filter((job) => job.sourceName === '猎聘').length,
        note: '根据公开职位详情页收录；类目页的 33780 份是薪资样本数，不是当前在招岗位数。',
      },
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
