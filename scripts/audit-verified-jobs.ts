import verifiedJobs from '../src/data/verified-jobs';

const offline = process.argv.includes('--offline');

function normalize(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/gi, '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[\s\u00a0]+/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .trim();
}

async function main() {
  const errors: string[] = [];
  const ids = new Set<number>();

  for (const job of verifiedJobs) {
    if (ids.has(job.id)) errors.push(`ID ${job.id}: duplicate id`);
    ids.add(job.id);
    if (job.verification_level !== '逐字段核验') errors.push(`ID ${job.id}: missing verification_level`);
    if (!job.source_title?.trim()) errors.push(`ID ${job.id}: missing source_title`);
    if (!job.source_evidence?.length) errors.push(`ID ${job.id}: missing source_evidence`);
    if (!job.source_url.startsWith('https://')) errors.push(`ID ${job.id}: source_url must use HTTPS`);
    if (job.is_demo) errors.push(`ID ${job.id}: verified dataset cannot contain demo data`);

    if (!offline && job.source_evidence?.length) {
      try {
        const response = await fetch(job.source_url, { headers: { 'user-agent': 'JiaodianCareersSourceAudit/1.0' } });
        if (!response.ok) {
          errors.push(`ID ${job.id}: source returned HTTP ${response.status}`);
          continue;
        }
        const source = normalize(await response.text());
        if (job.source_title && !source.includes(normalize(job.source_title))) {
          errors.push(`ID ${job.id}: source title not found: ${job.source_title}`);
        }
        const [year, month, day] = job.published_at.split('-').map(Number);
        const publishedAtVariants = [
          job.published_at,
          `${year}年${month}月${day}日`,
          `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`,
        ];
        if (!publishedAtVariants.some((variant) => source.includes(normalize(variant)))) {
          errors.push(`ID ${job.id}: published_at not found in source: ${job.published_at}`);
        }
        for (const fragment of job.source_evidence) {
          if (!source.includes(normalize(fragment))) {
            errors.push(`ID ${job.id}: source evidence not found: ${fragment}`);
          }
        }
      } catch (error) {
        errors.push(`ID ${job.id}: source fetch failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log(`Audited ${verifiedJobs.length} verified jobs${offline ? ' (schema only)' : ' against source pages'}.`);
}

main();
