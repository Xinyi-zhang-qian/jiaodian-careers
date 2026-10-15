import verifiedJobs from '../src/data/verified-jobs';
import restoredJobs from '../src/data/restored-jobs';

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

  const jobs = [...verifiedJobs, ...restoredJobs];
  for (const job of jobs) {
    if (ids.has(job.id)) errors.push(`ID ${job.id}: duplicate id`);
    ids.add(job.id);
    if (!job.verification_level) errors.push(`ID ${job.id}: missing verification_level`);
    if (job.verification_level !== '待核实' && !job.source_title?.trim()) errors.push(`ID ${job.id}: missing source_title`);
    if (job.verification_level !== '待核实' && !job.source_evidence?.length) errors.push(`ID ${job.id}: missing source_evidence`);
    if (job.verification_level === '待核实' && (job.source_evidence?.length || job.original_major_requirements || job.education || job.experience || job.salary || job.responsibilities || job.deadline)) {
      errors.push(`ID ${job.id}: unverified listing contains unverified condition fields`);
    }
    if (job.verification_level === '逐字段核验' && !job.source_url.startsWith('https://')) errors.push(`ID ${job.id}: source_url must use HTTPS`);
    if (job.is_demo) errors.push(`ID ${job.id}: verified dataset cannot contain demo data`);

    if (!offline && job.source_evidence?.length && job.verification_level !== '关键字段核验') {
      try {
        const response = await fetch(job.source_url, { headers: { 'user-agent': 'JiaodianCareersSourceAudit/1.0' } });
        if (!response.ok) {
          errors.push(`ID ${job.id}: source returned HTTP ${response.status}`);
          continue;
        }
        const source = normalize(await response.text());
        if (job.verification_level === '逐字段核验' && job.source_title && !source.includes(normalize(job.source_title))) {
          errors.push(`ID ${job.id}: source title not found: ${job.source_title}`);
        }
        if (job.verification_level === '逐字段核验') {
          const [year, month, day] = job.published_at.split('-').map(Number);
          const publishedAtVariants = [job.published_at, `${year}年${month}月${day}日`, `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`];
          if (!publishedAtVariants.some((variant) => source.includes(normalize(variant)))) {
            errors.push(`ID ${job.id}: published_at not found in source: ${job.published_at}`);
          }
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

  const fieldVerified = jobs.filter((job) => job.verification_level === '逐字段核验').length;
  const sourceVerified = jobs.filter((job) => job.verification_level === '来源核验').length;
  const keyFieldVerified = jobs.filter((job) => job.verification_level === '关键字段核验').length;
  console.log(`Audited ${jobs.length} public jobs (${fieldVerified} field-level, ${sourceVerified} source-level, ${keyFieldVerified} key-field)${offline ? ' (schema only)' : ' against source pages'}.`);
}

main();
