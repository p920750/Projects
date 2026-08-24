const axios = require('axios');
const Job = require('../models/Job');

// Comprehensive dictionary mapping recognized tech keywords to canonical display names
const TECH_DICTIONARY = {
  // JavaScript / TypeScript ecosystem
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'react native': 'React Native',
  'react-native': 'React Native',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'express.js': 'Express.js',
  'nestjs': 'NestJS',
  'nest.js': 'NestJS',
  'fastify': 'Fastify',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'angular': 'Angular',
  'angularjs': 'Angular',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'nuxt': 'Nuxt.js',
  'nuxtjs': 'Nuxt.js',
  'remix': 'Remix',
  'astro': 'Astro',
  'gatsby': 'Gatsby',
  'svelte': 'Svelte',
  'sveltekit': 'SvelteKit',
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'redux': 'Redux',
  'zustand': 'Zustand',
  'mobx': 'MobX',
  'jquery': 'jQuery',
  'vite': 'Vite',
  'webpack': 'Webpack',
  'vitest': 'Vitest',
  'jest': 'Jest',
  'cypress': 'Cypress',
  'playwright': 'Playwright',

  // Backend / Programming Languages
  'python': 'Python',
  'py': 'Python',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI',
  'golang': 'Go',
  'go': 'Go',
  'rust': 'Rust',
  'java': 'Java',
  'spring': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'springboot': 'Spring Boot',
  'c#': 'C#',
  'csharp': 'C#',
  '.net': '.NET',
  'dotnet': '.NET',
  'asp.net': 'ASP.NET',
  'c++': 'C++',
  'cpp': 'C++',
  'c': 'C',
  'php': 'PHP',
  'laravel': 'Laravel',
  'symfony': 'Symfony',
  'ruby': 'Ruby',
  'ruby on rails': 'Ruby on Rails',
  'rails': 'Ruby on Rails',
  'scala': 'Scala',
  'kotlin': 'Kotlin',
  'swift': 'Swift',
  'dart': 'Dart',
  'flutter': 'Flutter',
  'elixir': 'Elixir',
  'phoenix': 'Phoenix',
  'clojure': 'Clojure',
  'haskell': 'Haskell',
  'lua': 'Lua',
  'perl': 'Perl',
  'solidity': 'Solidity',
  'r': 'R',

  // API & Communication Protocols
  'graphql': 'GraphQL',
  'rest': 'REST API',
  'rest api': 'REST API',
  'restful': 'REST API',
  'grpc': 'gRPC',
  'websocket': 'WebSocket',
  'websockets': 'WebSocket',

  // Databases, Caching & Search
  'sql': 'SQL',
  'nosql': 'NoSQL',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'psql': 'PostgreSQL',
  'mysql': 'MySQL',
  'mariadb': 'MariaDB',
  'redis': 'Redis',
  'sqlite': 'SQLite',
  'dynamodb': 'DynamoDB',
  'cassandra': 'Cassandra',
  'elasticsearch': 'Elasticsearch',
  'opensearch': 'OpenSearch',
  'supabase': 'Supabase',
  'firebase': 'Firebase',
  'snowflake': 'Snowflake',
  'bigquery': 'BigQuery',
  'clickhouse': 'ClickHouse',
  'prisma': 'Prisma',
  'typeorm': 'TypeORM',
  'mongoose': 'Mongoose',

  // Cloud, Infrastructure & DevOps
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'GCP',
  'google cloud': 'GCP',
  'azure': 'Azure',
  'terraform': 'Terraform',
  'ansible': 'Ansible',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'jenkins': 'Jenkins',
  'github actions': 'GitHub Actions',
  'gitlab ci': 'GitLab CI',
  'git': 'Git',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'linux': 'Linux',
  'unix': 'Unix',
  'nginx': 'Nginx',
  'apache': 'Apache',
  'serverless': 'Serverless',
  'lambda': 'AWS Lambda',
  'helm': 'Helm',
  'prometheus': 'Prometheus',
  'grafana': 'Grafana',
  'cloudflare': 'Cloudflare',
  'kafka': 'Kafka',
  'rabbitmq': 'RabbitMQ',

  // AI / ML / Data Engineering
  'pytorch': 'PyTorch',
  'tensorflow': 'TensorFlow',
  'keras': 'Keras',
  'scikit-learn': 'Scikit-learn',
  'sklearn': 'Scikit-learn',
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'spark': 'Apache Spark',
  'airflow': 'Airflow',
  'langchain': 'LangChain',
  'llm': 'LLM',
  'openai': 'OpenAI',
  'machine learning': 'Machine Learning',
  'deep learning': 'Deep Learning',
  'data science': 'Data Science',

  // Styling & UI Frameworks
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'bootstrap': 'Bootstrap',
  'sass': 'Sass',
  'scss': 'Sass',
  'html': 'HTML5',
  'html5': 'HTML5',
  'css': 'CSS3',
  'css3': 'CSS3',
  'material ui': 'Material UI',
  'mui': 'Material UI',
  'chakra ui': 'Chakra UI'
};

// Non-technical and generic tags to strictly ignore during normalization
const NON_TECH_TAGS = new Set([
  'executive',
  'sales',
  'medical',
  'legal',
  'edu',
  'education',
  'customer support',
  'customer service',
  'support',
  'virtual assistant',
  'assistant',
  'marketing',
  'digital marketing',
  'growth',
  'content',
  'copywriting',
  'writing',
  'seo',
  'sem',
  'social media',
  'finance',
  'accounting',
  'payroll',
  'billing',
  'recruiting',
  'recruiter',
  'talent',
  'hr',
  'human resources',
  'non tech',
  'non-tech',
  'operations',
  'ops',
  'community',
  'community manager',
  'entry level',
  'junior',
  'senior',
  'lead',
  'principal',
  'staff',
  'director',
  'head of',
  'vp',
  'manager',
  'full time',
  'part time',
  'contract',
  'freelance',
  'internship',
  'remote',
  'worldwide',
  'usa',
  'europe',
  'uk',
  'canada',
  'apac',
  'emea',
  'latam',
  'english',
  'spanish',
  'french',
  'german',
  'other',
  'general',
  'tech',
  'dev',
  'developer',
  'engineer',
  'software'
]);

// Explicit non-technical patterns to reject
const EXPLICIT_NON_TECH_PATTERNS = [
  // User-specified keywords & phrases
  /\bfacilit(y|ies)\b/i,
  /\bplanner\b/i,
  /\blocator\b/i,
  /\bvaluer\b/i,
  /\bloan\b/i,
  /\bany open position\b/i,
  /\bgeneral application\b/i,
  /\badministrative\b/i,
  /\boperations\b/i,

  // Flight & Travel
  /\bflight attendant\b/i,
  /\bpilot\b/i,
  /\bcabin crew\b/i,
  /\btravel agent\b/i,

  // Hotel, Hospitality & Housekeeping
  /\broom attendant\b/i,
  /\bhousekeep(ing|er)?\b/i,
  /\bporter\b/i,
  /\bconcierge\b/i,
  /\bjanitor\b/i,
  /\bcustodian\b/i,
  /\bmaid\b/i,
  /\bcleaner\b/i,
  /\bfront desk\b/i,
  /\bhotel\b/i,
  /\bhospitality\b/i,
  /\bvalet\b/i,

  // Food & Beverage
  /\bwaiter\b/i,
  /\bwaitress\b/i,
  /\bbartender\b/i,
  /\bbarista\b/i,
  /\bchef\b/i,
  /\bcook\b/i,
  /\bdishwasher\b/i,
  /\bfood server\b/i,

  // Maintenance & Trades / Manual Labor
  /\bpainter\b/i,
  /\bmaintenance\b/i,
  /\bplumber\b/i,
  /\belectrician\b/i,
  /\bcarpenter\b/i,
  /\bmechanic\b/i,
  /\bwelder\b/i,
  /\bhvac\b/i,
  /\bhandyman\b/i,
  /\blandscap(er|ing)\b/i,
  /\bconstruction\b/i,
  /\bwarehouse\b/i,
  /\bforklift\b/i,

  // Sales, Marketing & Business Non-Tech
  /\bsales\b/i,
  /\baccount executive\b/i,
  /\bbdr\b/i,
  /\bsdr\b/i,
  /\btelemarketer\b/i,
  /\breal estate\b/i,
  /\brealtor\b/i,
  /\bleasing\b/i,
  /\bproperty manager\b/i,

  // Admin, Virtual & Customer Support Non-Tech
  /\bvirtual assistant\b/i,
  /\bexecutive assistant\b/i,
  /\badmin assistant\b/i,
  /\boffice assistant\b/i,
  /\breceptionist\b/i,
  /\bcustomer (support|service|success|care)\b/i,
  /\bcall center\b/i,

  // Healthcare / Medical
  /\bnurse\b/i,
  /\bnursing\b/i,
  /\bdoctor\b/i,
  /\bphysician\b/i,
  /\btherapist\b/i,
  /\bdental\b/i,
  /\bdentist\b/i,
  /\bpharmacist\b/i,
  /\bcaregiver\b/i,
  /\bphlebotomist\b/i,
  /\bmedical\b/i,

  // Legal & Education
  /\blawyer\b/i,
  /\battorney\b/i,
  /\bparalegal\b/i,
  /\blegal\b/i,
  /\bteacher\b/i,
  /\btutor\b/i,
  /\bprofessor\b/i,
  /\bdaycare\b/i,
  /\bnanny\b/i,

  // Transportation & Security
  /\bdriver\b/i,
  /\btruck driver\b/i,
  /\bchauffeur\b/i,
  /\bcourier\b/i,
  /\bsecurity guard\b/i,
  /\bsecurity officer\b/i,

  // HR, Marketing, & Non-Tech Finance
  /\brecruiter\b/i,
  /\btalent acquisition\b/i,
  /\bhuman resources\b/i,
  /\bhr coordinator\b/i,
  /\bhr generalist\b/i,
  /\bmarketing\b/i,
  /\bcopywriter\b/i,
  /\bcontent creator\b/i,
  /\bseo specialist\b/i,
  /\bfinance\b/i,
  /\baccountant\b/i,
  /\bbookkeeper\b/i
];

// Positive patterns identifying explicit technical and engineering roles
const EXPLICIT_TECH_PATTERNS = [
  /\b(software|developer|engineer|programmer|architect|coder|tech lead|technical lead|cto|vp of engineering|director of engineering|engineering manager)\b/i,
  /\b(devops|sre|site reliability|cloud engineer|cloud architect|sysadmin|systems administrator|infrastructure engineer|platform engineer)\b/i,
  /\b(data engineer|data scientist|machine learning|ml engineer|ai engineer|nlp|deep learning|data analyst|bi developer)\b/i,
  /\b(full\s?stack|frontend|front-end|backend|back-end|web developer|mobile developer|ios developer|android developer|ui\/ux engineer)\b/i,
  /\b(database administrator|dba|database engineer|sql developer|security engineer|cybersecurity|infosec|penetration tester|qa engineer|sdet|automation engineer|test engineer)\b/i,
  /\b(react|node|python|javascript|typescript|golang|rust|java|c#|\.net|c\+\+|php|ruby|swift|kotlin|django|spring|graphql|aws|kubernetes|docker|solidity|blockchain)\b/i
];

/**
 * Checks whether a given job title represents an explicitly technical/engineering position.
 * Rejects titles matching any non-technical patterns and requires explicit technical criteria.
 * @param {string} title
 * @returns {boolean}
 */
function isTechnicalJob(title) {
  if (!title || typeof title !== 'string') return false;
  const cleanTitle = title.trim();
  if (!cleanTitle) return false;

  // 1. Must NOT match any explicit non-technical pattern
  for (const pattern of EXPLICIT_NON_TECH_PATTERNS) {
    if (pattern.test(cleanTitle)) {
      return false;
    }
  }

  // 2. Must match an explicitly technical/engineering role pattern
  const isExplicitlyTech = EXPLICIT_TECH_PATTERNS.some(pattern => pattern.test(cleanTitle));
  return isExplicitlyTech;
}

/**
 * Normalizes an array of raw tags/technologies or a comma-separated string,
 * strictly filtering out generic non-technical tags and preserving real tech stack items.
 * @param {Array|string} rawTags
 * @returns {Array<string>} normalized unique tech stack
 */
function normalizeTechStack(rawTags) {
  if (!rawTags) return [];

  let tagList = [];
  if (Array.isArray(rawTags)) {
    tagList = rawTags;
  } else if (typeof rawTags === 'string') {
    tagList = rawTags.split(/[,|\n/]/).map(t => t.trim());
  }

  const normalizedSet = new Set();

  for (const tag of tagList) {
    if (!tag || typeof tag !== 'string') continue;
    const cleanTag = tag.trim();
    if (!cleanTag) continue;

    const lowerTag = cleanTag.toLowerCase();

    // 1. Ignore if in explicit non-technical tags set
    if (NON_TECH_TAGS.has(lowerTag)) {
      continue;
    }

    // 2. Check canonical tech dictionary
    if (TECH_DICTIONARY[lowerTag]) {
      normalizedSet.add(TECH_DICTIONARY[lowerTag]);
    }
  }

  return Array.from(normalizedSet);
}

/**
 * Delays execution for specified milliseconds
 * @param {number} ms
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Triggers scraper collector on Bright Data
 * @returns {Promise<string>} snapshot_id or collection_id
 */
async function triggerBrightDataScrape() {
  const collectorId = process.env.BRIGHT_DATA_COLLECTOR_ID;
  const apiToken = process.env.BRIGHT_DATA_API_TOKEN;

  if (!collectorId || !apiToken) {
    throw new Error('Missing BRIGHT_DATA_COLLECTOR_ID or BRIGHT_DATA_API_TOKEN in environment variables.');
  }

  const triggerUrl = `https://api.brightdata.com/dca/trigger?collector=${collectorId}&queue_next=1`;
  const payload = [{ url: 'https://remoteok.com/remote-dev-jobs' }];

  console.log(`[Scraper] Triggering Bright Data DCA collector (${collectorId})...`);

  const response = await axios.post(triggerUrl, payload, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  });

  const snapshotId =
    response.data?.snapshot_id ||
    response.data?.collection_id ||
    response.data?.id ||
    (typeof response.data === 'string' ? response.data : null);

  if (!snapshotId) {
    console.error('[Scraper] Unexpected trigger response:', response.data);
    throw new Error('Failed to obtain snapshot_id or collection_id from Bright Data trigger response.');
  }

  console.log(`[Scraper] Triggered successfully. Snapshot ID: ${snapshotId}`);
  return snapshotId;
}

/**
 * Polls Bright Data dataset endpoint until results are ready
 * @param {string} snapshotId
 * @param {number} maxAttempts
 * @param {number} intervalMs
 * @returns {Promise<Array>} Scraped job items
 */
async function pollBrightDataDataset(snapshotId, maxAttempts = 30, intervalMs = 5000) {
  const apiToken = process.env.BRIGHT_DATA_API_TOKEN;
  const datasetUrl = `https://api.brightdata.com/dca/dataset?id=${snapshotId}`;

  console.log(`[Scraper] Polling dataset for snapshot: ${snapshotId} every ${intervalMs / 1000}s...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(intervalMs);

    try {
      const response = await axios.get(datasetUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        },
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        let items = response.data;

        // Handle NDJSON string format (newline-delimited JSON)
        if (typeof items === 'string') {
          try {
            items = items
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .map(line => JSON.parse(line));
          } catch (parseErr) {
            console.warn('[Scraper] Could not parse string response as NDJSON, trying JSON.parse:', parseErr.message);
            try {
              items = JSON.parse(items);
            } catch (e) {
              console.warn('[Scraper] Response is not yet complete JSON, continuing poll...');
              continue;
            }
          }
        }

        // Verify if data is an array and not an ongoing status object
        if (Array.isArray(items) && items.length > 0) {
          console.log(`[Scraper] Successfully retrieved ${items.length} job records on attempt ${attempt}.`);
          return items;
        }

        if (items && items.status && ['building', 'collecting', 'pending', 'running'].includes(items.status.toLowerCase())) {
          console.log(`[Scraper] Attempt ${attempt}/${maxAttempts}: Status is "${items.status}". Waiting...`);
          continue;
        }

        if (Array.isArray(items) && items.length === 0) {
          console.log(`[Scraper] Attempt ${attempt}/${maxAttempts}: Empty data received, continuing to wait...`);
          continue;
        }
      } else if (response.status === 202) {
        console.log(`[Scraper] Attempt ${attempt}/${maxAttempts}: Status 202 (Processing). Waiting...`);
      } else {
        console.log(`[Scraper] Attempt ${attempt}/${maxAttempts}: Received status ${response.status}. Waiting...`);
      }
    } catch (pollError) {
      console.warn(`[Scraper] Attempt ${attempt}/${maxAttempts} request error: ${pollError.message}`);
    }
  }

  throw new Error(`Scraper timed out after ${maxAttempts} attempts waiting for snapshot ${snapshotId}.`);
}

/**
 * Parses and validates raw scraped job item into schema-compliant job object.
 * Filters out non-technical job roles and non-technical tags.
 * @param {Object} rawJob
 * @returns {Object|null}
 */
function parseRawJob(rawJob) {
  if (!rawJob || typeof rawJob !== 'object') return null;

  const job_title =
    rawJob.job_title ||
    rawJob.title ||
    rawJob.position ||
    rawJob.role ||
    rawJob.name;

  const company_name =
    rawJob.company_name ||
    rawJob.company ||
    rawJob.employer ||
    rawJob.organization;

  if (!job_title || !company_name) {
    return null; // Required fields missing
  }

  const cleanTitle = String(job_title).trim();

  // Filter out non-technical job titles
  if (!isTechnicalJob(cleanTitle)) {
    console.log(`[Scraper] Filtering out non-technical role: "${cleanTitle}" at "${company_name}"`);
    return null;
  }

  const location =
    rawJob.location ||
    rawJob.location_country ||
    rawJob.locations ||
    rawJob.region ||
    'Remote';

  const is_remote =
    rawJob.is_remote !== undefined
      ? Boolean(rawJob.is_remote)
      : (typeof location === 'string' && location.toLowerCase().includes('remote')) ||
        (typeof rawJob.url === 'string' && rawJob.url.toLowerCase().includes('remote'));

  const salary =
    rawJob.salary ||
    rawJob.compensation ||
    (rawJob.salary_min && rawJob.salary_max ? `$${rawJob.salary_min} - $${rawJob.salary_max}` : '') ||
    'Not specified';

  const rawTags =
    rawJob.tech_stack ||
    rawJob.tags ||
    rawJob.skills ||
    rawJob.keywords ||
    rawJob.technologies ||
    [];

  const tech_stack = normalizeTechStack(rawTags);

  return {
    job_title: cleanTitle,
    company_name: String(company_name).trim(),
    location: String(location).trim(),
    is_remote,
    salary: String(salary).trim(),
    tech_stack,
    scrapedAt: new Date()
  };
}

/**
 * Main scraper workflow: triggers scrape, polls results, normalizes, and saves to MongoDB
 * @returns {Promise<Object>} Scraping summary
 */
async function scrapeAndStoreJobs() {
  const snapshotId = await triggerBrightDataScrape();
  const rawJobs = await pollBrightDataDataset(snapshotId);

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let nonTechnicalFiltered = 0;
  const processedJobs = [];

  for (const rawItem of rawJobs) {
    const rawTitle = rawItem?.job_title || rawItem?.title || rawItem?.position;
    if (rawTitle && !isTechnicalJob(rawTitle)) {
      nonTechnicalFiltered++;
      skippedCount++;
      continue;
    }

    const jobData = parseRawJob(rawItem);
    if (!jobData) {
      skippedCount++;
      continue;
    }

    try {
      const result = await Job.findOneAndUpdate(
        {
          job_title: jobData.job_title,
          company_name: jobData.company_name
        },
        {
          $set: jobData
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          rawResult: true
        }
      );

      if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
        updatedCount++;
      } else {
        insertedCount++;
      }

      processedJobs.push(result.value);
    } catch (saveError) {
      console.error(`[Scraper] Error saving job "${jobData.job_title}" at "${jobData.company_name}":`, saveError.message);
      skippedCount++;
    }
  }

  console.log(
    `[Scraper] Completed: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped (${nonTechnicalFiltered} non-tech filtered).`
  );

  return {
    success: true,
    snapshotId,
    totalScraped: rawJobs.length,
    insertedCount,
    updatedCount,
    skippedCount,
    nonTechnicalFiltered,
    sampleJobs: processedJobs.slice(0, 5)
  };
}

module.exports = {
  triggerBrightDataScrape,
  pollBrightDataDataset,
  normalizeTechStack,
  isTechnicalJob,
  parseRawJob,
  scrapeAndStoreJobs,
  TECH_DICTIONARY,
  NON_TECH_TAGS,
  EXPLICIT_NON_TECH_PATTERNS,
  EXPLICIT_TECH_PATTERNS
};
