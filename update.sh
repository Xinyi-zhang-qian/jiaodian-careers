#!/usr/bin/env bash
# 一键更新：提交本地改动并推送到 GitHub。
# 推送成功后，Vercel 会自动重新部署，网址不变。
set -e
cd "$(dirname "$0")"

git add -A
if git diff --cached --quiet; then
  echo "已是最新，没有需要提交的改动。"
  exit 0
fi

msg="${1:-update: 更新内容}"
git commit -m "$msg"
git push
echo "已推送。Vercel 将自动重新部署（网址不变）。"
