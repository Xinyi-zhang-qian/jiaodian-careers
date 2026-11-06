import type { Job } from '../../lib/types';

import coreVerified from './core-verified';
import leads from './leads-2026-09';
import shlab from './shlab-2026';
import restored from './restored-2026-10';
import beijing from './beijing-2026-11';
import shanghai from './shanghai-2026-11';
import crossDisciplinary from './cross-disciplinary-2026-11';
import publicSector from './public-sector-2026-11';
import researchInstitutes from './research-institutes-2026-11';
import enterpriseBigtech from './enterprise-bigtech-2026-11';
import publicSectorBjsh from './public-sector-bjsh-2026-11';
import tencentHuawei from './tencent-huawei-2026-11';

// 规范数据源唯一聚合入口：显式列出全部批次并聚合（契约 13，禁止目录扫描式动态导入）。
const jobsCatalog: Job[] = [...coreVerified, ...leads, ...shlab, ...restored, ...beijing, ...shanghai, ...crossDisciplinary, ...publicSector, ...researchInstitutes, ...enterpriseBigtech, ...publicSectorBjsh, ...tencentHuawei];

export default jobsCatalog;
