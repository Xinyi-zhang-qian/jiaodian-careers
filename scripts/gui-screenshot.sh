#!/usr/bin/env bash
# GUI 视觉验收截图脚本（::ci 步骤 4）：逐页截图 + 关键交互流程镜头，产物落 workspace/gui_visual/。
# 依赖：本机 Google Chrome（headless 模式）；先由调用方启动静态服务器（BASE_URL）。
set -euo pipefail
cd "$(dirname "$0")/.."
BASE_URL="${BASE_URL:-http://127.0.0.1:8123}"
OUT=workspace/gui_visual
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT"
rm -f "$OUT"/*.png "$OUT"/manifest.json

viewport="--window-size=1280,1600 --hide-scrollbars --virtual-time-budget=9000 --force-device-scale-factor=1"

shot() { # name path
  local name="$1"
  local path="$2"
  local file="$OUT/$name.png"
  if "$CHROME" --headless=new $viewport --screenshot="$file" "$BASE_URL$path" >/dev/null 2>&1 \
     && [ -s "$file" ] && [ "$(stat -f%z "$file")" -gt 20000 ]; then
    echo "ok   $name ($(stat -f%z "$file") bytes)"
  else
    echo "FAIL $name"; exit 1
  fi
}

shot home "/"
shot jobs "/jobs/"
shot detail-field "/jobs/577/"
shot detail-shiye "/jobs/${SAMPLE_SHIYE_ID:-401}/"
shot directions "/directions/"
shot favorites "/favorites/"
shot internships "/internships/"
shot analysis "/analysis/"
shot market "/market/"
shot market-robotics "/market/robotics/"
shot notfound "/nonexistent-page/"
shot flow-function "/jobs/?function=产品经理"
shot flow-deadline "/jobs/?sort=deadline"

python3 - "$OUT" "$BASE_URL" "${SAMPLE_SHIYE_ID:-401}" << 'PY'
import json, os, sys, datetime
out, base, shiye_id = sys.argv[1], sys.argv[2], sys.argv[3] or '2001'
pages = ['home','jobs','detail-field','detail-shiye','directions','favorites','internships','analysis','market','market-robotics','notfound','flow-function','flow-deadline']
manifest = {
  'generated_at': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
  'base_url': base,
  'browser': 'Google Chrome（headless=new 命令行截图；控制台错误未采集，采集方式限制如实记录）',
  'viewport': '1280x1600, DPR 1, 隐藏滚动条, virtual-time-budget 9000ms',
  'console_errors': '未采集（chrome headless 命令行截图模式不支持控制台日志导出；JS 错误经渲染结果判读兜底）',
  'pages': [{'name': n, 'file': f'{n}.png', 'bytes': os.path.getsize(os.path.join(out, f'{n}.png'))} for n in pages],
}
json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), ensure_ascii=False, indent=2)
print('manifest.json 写入完成（%d 页）' % len(pages))
PY
