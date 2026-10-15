import type { Job } from '../lib/types';

// Added from individual Shanghai AI Laboratory recruitment pages checked on
// 2026-10-15. Each record keeps the exact job title and direct source page.
const checkedAt = '2026-10-15';
const organization = '上海人工智能实验室';

function makeJob(
  id: number,
  title: string,
  jobType: string,
  sourceUrl: string,
  description: string,
  requirements: string,
  skills: string[],
  education: string,
  experience: string,
  publishedAt: string,
  recruitType: '社招' | '校招' = '社招',
): Job {
  return {
    id: id + 500,
    title,
    organization,
    province: '上海',
    city: '上海',
    location: '上海市徐汇区龙文路129号国际传媒港L1楼',
    org_type: '科研院所',
    job_type: jobType,
    original_major_requirements: requirements,
    platform_disciplines: ['人工智能×工程技术'],
    required_skills: skills,
    preferred_skills: [],
    education,
    experience,
    salary: null,
    description,
    responsibilities: description,
    application_info: '请通过来源页面中的“投递”入口申请；页面列出的联系邮箱为 comm@pjlab.org.cn。',
    published_at: publishedAt,
    deadline: null,
    source_name: organization,
    source_type: '官网',
    source_url: sourceUrl,
    fetched_at: checkedAt,
    last_verified: checkedAt,
    status: '招聘中',
    is_demo: false,
    recruit_type: recruitType,
    verification_level: '逐字段核验',
    source_title: title,
    source_evidence: [title, organization, '上海市徐汇区龙文路129号国际传媒港L1楼'],
  };
}

const additionalVerifiedJobs: Job[] = [
  makeJob(600, '大模型应用算法工程师', '算法', 'https://www.shlab.org.cn/joinus/detail/7540111744543443250?mode=social', '负责垂直领域大模型训练、RAG与Agent应用、产品原型开发和算法落地。', '计算机科学、人工智能、电子信息等相关专业本科及以上。', ['Python', 'PyTorch', 'LLM', 'RAG', 'Agent'], '本科及以上', '不限', '2026-08-13'),
  makeJob(601, '大模型训练算法工程师', '算法', 'https://www.shlab.org.cn/joinus/detail/7615234376275773734?mode=social', '负责CPT、SFT、RLHF/DPO等大模型训练、数据构建、评测和训练性能调优。', '计算机、人工智能、数学等相关专业硕士及以上。', ['Python', 'PyTorch', 'Megatron-LM', 'RLHF', 'DPO'], '硕士及以上', '1-2年相关经验', '2026-08-13'),
  makeJob(602, '大模型训练青年研究员/工程师', '科研', 'https://www.shlab.org.cn/joinus/detail/7655230341552752923?mode=8', '参与面向科学推理任务的大模型后训练算法研究、实验验证和模型迭代。', '计算机、数学、统计学等相关专业。', ['SFT', 'RL', 'OPD', 'PyTorch', '大模型后训练'], '硕士及以上', '不限', '2026-07-16', '校招'),
  makeJob(603, '大模型评测算法工程师', '算法', 'https://www.shlab.org.cn/joinus/detail/7555353313010223401', '参与文本、图文、视频和Agent等场景的大模型评测基准、评测算法及结果分析。', '计算机、人工智能或相关专业硕士及以上。', ['LLM', 'MLLM', 'Agent', 'Python', 'PyTorch'], '硕士及以上', '不限', '2026-09-21'),
  makeJob(604, '基座模型算法工程师/青年研究员', '科研', 'https://www.shlab.org.cn/joinus/detail/7678663376582986027?mode=social', '开展大模型后训练、智能体自我演化和高质量合成数据方法研究。', '自然语言处理、机器学习、计算机视觉等相关专业硕士及以上。', ['LLM', 'SFT', 'RL', 'Agentic RL', 'Verl'], '硕士及以上', '不限', '2026-08-28'),
  makeJob(605, '大模型训练框架算法工程师', '算法', 'https://www.shlab.org.cn/joinus/detail/7563274661065886006?mode=social', '负责大模型预训练、SFT、RL等任务的分布式训练框架、性能优化和稳定性建设。', '计算机科学、人工智能或相关领域本科及以上。', ['PyTorch', 'DeepSpeed', 'FSDP', 'Megatron', 'NCCL'], '本科及以上', '不限', '2026-07-27'),
  makeJob(606, 'AI应用评测工程师', '工程', 'https://www.shlab.org.cn/joinus/detail/7674889611902683418?mode=social', '建设模型、Harness、Agent和AI4S场景的自动化评测框架与评测闭环。', '计算机相关专业本科及以上，3年以上相关经验。', ['Python', 'Java', 'Go', 'Benchmark', 'Agent评测'], '本科及以上', '3年以上', '2026-08-17'),
  makeJob(607, '多模态大模型算法工程师（架构方向）', '算法', 'https://www.shlab.org.cn/joinus/detail/7678625307444742463?mode=social', '参与统一多模态大模型训练调优、数据生产配比、数据评估和算法库建设。', '计算机或人工智能相关专业硕士及以上。', ['多模态大模型', '数据合成', 'DeepSpeed', 'Megatron', 'vLLM'], '硕士及以上', '不限', '2026-10-14'),
  makeJob(608, '科学多模态大模型算法工程师', 'AI4S', 'https://www.shlab.org.cn/joinus/detail/7678626664427686153?mode=social', '负责化学、生命科学、材料、地球科学和物理等领域的多模态数据、模型训练及科学Benchmark评测。', '硕士及以上；有科学领域背景或相关数据库经验优先。', ['AI4S', '多模态大模型', '科学数据', 'Benchmark', 'OpenCompass'], '硕士及以上', '不限', '2026-08-27'),
  makeJob(609, '大模型算法工程师-微电子垂类应用方向', '算法', 'https://www.shlab.org.cn/joinus/detail/7553288666938394934?jobFunction=&jobType=&keyword=&location=&mode=social&subject=', '负责微电子和电路设计场景的大模型推理增强、数据构造、训练评估及智能体搭建。', '计算机、人工智能、微电子等相关专业硕士及以上。', ['RLVR', 'PyTorch', '大模型推理', '微电子', 'Agent'], '硕士及以上', '不限', '2025-09-23'),
  makeJob(610, '大模型强化学习青年研究员/算法工程师', '科研', 'https://www.shlab.org.cn/joinus/detail/7684098206242638123?mode=social', '参与文本、多模态和智能体强化学习算法、奖励模型、训练系统和实验迭代。', '计算机科学、人工智能、数学、统计、电子工程等相关专业。', ['PPO', 'GRPO', 'RLHF', 'PyTorch', 'Ray'], '本科及以上', '不限', '2026-09-11'),
  makeJob(611, '仿真算法青年科学家', '科研', 'https://www.shlab.org.cn/joinus/detail/7675575188771129643?mode=social', '主导具身智能仿真引擎、可微物理仿真、图形渲染、机器人动力学和多智能体仿真架构。', '计算机科学、计算机图形学或相关领域硕士以上，具有仿真引擎经验。', ['Unity', 'Unreal', 'Isaac Sim', '物理模拟', '分布式系统'], '硕士及以上', '5年以上', '2026-08-27'),
  makeJob(612, '具身多智能体青年研究员', '科研', 'https://www.shlab.org.cn/joinus/detail/7673412432672688394?mode=social', '开展具身多智能体任务分解、通信协调、协同优化及真机或仿真验证。', '计算机、人工智能、机器人等相关专业博士。', ['多智能体', '分布式系统', '具身智能', '机器人', '仿真'], '博士', '不限', '2026-10-14'),
  makeJob(613, '具身模型部署算法工程师', '工程', 'https://www.shlab.org.cn/joinus/detail/7672669433710332166?mode=social', '负责VLA、世界模型等具身大模型向国产芯片和边缘板卡迁移、适配、部署及机器人闭环推理优化。', '计算机、软件工程、人工智能、电子信息、自动化等相关专业硕士及以上。', ['VLA', '世界模型', '模型部署', 'ROS/ROS2', '国产芯片'], '硕士及以上', '1-2年相关经验', '2026-10-14'),
  makeJob(614, '物理智能仿真与生成青年研究员', '科研', 'https://www.shlab.org.cn/joinus/detail/7687426093590055178?jobFunction=&jobType=&keyword=&location=&mode=3&subject=', '开展Real2Sim2Real、生成式仿真、可交互3D场景生成、合成数据和多模态物理仿真研究。', '计算机科学、人工智能、机器人、自动化、电子信息等相关专业，博士优先。', ['Real2Sim2Real', 'Isaac Sim', 'MuJoCo', 'World Model', '3D生成'], '博士优先', '不限', '2026-10-14', '校招'),
];

export default additionalVerifiedJobs;
