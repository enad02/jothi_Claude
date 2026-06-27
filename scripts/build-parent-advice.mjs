import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const siteUrl = "https://jothi.uk";
const contentDir = path.join(rootDir, "content", "parent-advice");
const outputDir = path.join(rootDir, "parent-advice");
const templateDir = path.join(rootDir, "templates");
const sitemapPath = path.join(rootDir, "sitemap.xml");

const approvedCategories = new Map([
  ["primary-to-secondary", "Primary to Secondary"],
  ["years-7-9", "Years 7-9"],
  ["gcse", "GCSE"],
  ["maths-confidence", "Maths Confidence"],
  ["a-level-maths", "A-Level"],
  ["sat-university", "University Admissions"],
  ["uk-school-system", "UK School System"]
]);

const categoryDescriptions = new Map([
  ["primary-to-secondary", "Support for the move from Year 6 into secondary school, including routines, confidence, independence and early learning habits."],
  ["years-7-9", "Guidance for the quiet but important KS3 years, when foundations, confidence and learning habits are built before GCSE pressure begins."],
  ["gcse", "Practical advice on mocks, revision, Year 10 preparation and how parents can respond calmly before exam pressure builds."],
  ["a-level-maths", "Guidance for families navigating A-Level choices, workload, sixth form independence, predicted grades, UCAS and preparation for competitive university routes."],
  ["sat-university", "Early guidance on competitive courses, subject choices, predicted grades, entrance exams and planning before deadlines create pressure."],
  ["uk-school-system", "Simple explanations of key stages, school structure and how parents can understand where their child is in the journey."]
]);

const allowedStatuses = new Set(["draft", "reviewed", "published", "archived"]);
const allowedIndexing = new Set(["index", "noindex"]);
let activeArticleReadingTime = "";
const requiredCoreUrls = [
  `${siteUrl}/`,
  `${siteUrl}/programmes`,
  `${siteUrl}/about`,
  `${siteUrl}/team`,
  `${siteUrl}/results`,
  `${siteUrl}/contact`
];

const whatsAppHref = "https://wa.me/447985588975?text=Hello%2C%20I%E2%80%99m%20contacting%20you%20from%20the%20Jothi%20Learning%20website.%0A%0AI%20would%20like%20to%20discuss%20support%20for%20my%20child.%0A%0AYear%20group%3A%0ASubjects%3A%0ACurrent%20position%20in%20school%3A%0AWhat%20you%20would%20like%20support%20with%3A";

const templates = {
  article: readFile(path.join(templateDir, "parent-advice-article.html")),
  index: readFile(path.join(templateDir, "parent-advice-index.html")),
  category: readFile(path.join(templateDir, "parent-advice-category.html"))
};

const sharedHeader = `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" id="top">
    <div class="main-nav-shell vd-hdr-brand vd-nav-bar">
      <div class="wrap main-nav">
        <a class="brand" href="/index.html" aria-label="Jothi Learning home">
          <img src="/Logo%202026.png" alt="Jothi Learning logo" width="90" height="90" />
          <span class="brand-lockup">
            <span class="brand-name">JOTHI</span>
            <span class="brand-subline">LEARNING</span>
            <span class="brand-tag">Serious teaching. Visible progress.</span>
          </span>
        </a>
      </div>
      <nav class="site-nav" id="siteNav" aria-label="Primary navigation">
        <div class="site-nav-inner vd-nav-bar-inner">
          <a href="/programmes.html">Programmes</a>
          <a href="/parent-advice/">Parents</a>
          <a href="/about.html">About</a>
          <a href="/team.html">Team</a>
          <a href="/results.html">Results</a>
          <a href="/contact.html">Contact</a>
          <span class="nav-dropdown">
            <a href="#" class="nav-dropdown-label" role="button" aria-haspopup="true" aria-expanded="false">Menu</a>
            <div class="nav-dropdown-panel">
              <a href="/students.html">For Students</a>
              <a href="/tutors.html">For Tutors</a>
            </div>
          </span>
        </div>
      </nav>
    </div>
  </header>`;

const sharedFooter = `
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <p class="footer-kicker">Jothi Learning</p>
        <h2>Clear structure. Serious teaching. Credible progress.</h2>
      </div>
      <div>
        <h3>Quick Access</h3>
        <nav class="footer-links" aria-label="Footer quick access">
          <a href="/students.html">For Students</a>
          <a href="/tutors.html">For Tutors</a>
        </nav>
      </div>
      <div>
        <h3>Site Navigation</h3>
        <nav class="footer-links" aria-label="Footer site navigation">
          <a href="/index.html">Home</a>
          <a href="/programmes.html">Programmes</a>
          <a href="/about.html">About</a>
          <a href="/team.html">Team</a>
          <a href="/results.html">Results</a>
          <a href="/contact.html">Contact</a>
          <a href="/contact.html#contact-form">Consultation</a>
          <a href="/privacy.html">Privacy</a>
          <a href="/cookies.html">Cookies</a>
          <a href="/terms.html">Terms</a>
        </nav>
      </div>
      <div class="legal-block">
        <h3>Legal Details</h3>
        <p>JOTHI LEARNING LIMITED</p>
        <p>Registered in England and Wales</p>
        <p>Company No. 12571880</p>
        <p>Registered office: 2 Wilmot Drive, Birmingham, B23 5UA</p>
        <p>ICO registration: ZC121472</p>
      </div>
    </div>
  </footer>`;

const whatsAppFloat = `
  <a class="wa-float" href="${whatsAppHref}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Jothi Learning">
    ${whatsAppIcon(28)}
  </a>`;

main();

function main() {
  const articles = loadArticles();
  validateArticles(articles);
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const visibleArticles = articles.filter((article) => article.status !== "archived");
  const categoryPages = buildCategoryPages(visibleArticles);

  writeArticlePages(visibleArticles);
  writeIndexPage(visibleArticles);
  writeSitemap(visibleArticles, categoryPages);

  console.log(`Parent Advice build complete: ${visibleArticles.length} article pages generated.`);
}

function loadArticles() {
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  return listMarkdownFiles(contentDir).map((filePath) => {
    const raw = readFile(filePath);
    const { data, body } = parseFrontMatter(raw, filePath);
    const categoryLabel = approvedCategories.get(data.category) || data.category_label;
    const canonicalPath = data.category && data.slug
      ? `/parent-advice/${data.category}/${data.slug}/`
      : "";

    return {
      ...data,
      sourcePath: filePath,
      body,
      category_label: categoryLabel,
      canonicalPath,
      canonicalUrl: canonicalPath ? `${siteUrl}${canonicalPath}` : "",
      outputPath: canonicalPath ? path.join(rootDir, canonicalPath, "index.html") : ""
    };
  });
}

function validateArticles(articles) {
  const slugs = new Map();

  for (const article of articles) {
    const source = path.relative(rootDir, article.sourcePath);
    required(article.title, "title", source);
    required(article.description, "description", source);
    required(article.slug, "slug", source);
    required(article.category, "category", source);
    required(article.last_updated, "last_updated", source);

    if (!approvedCategories.has(article.category)) {
      fail(`${source}: category "${article.category}" is not approved.`);
    }
    if (slugs.has(article.slug)) {
      fail(`${source}: slug "${article.slug}" duplicates ${slugs.get(article.slug)}.`);
    }
    slugs.set(article.slug, source);
    if (!allowedIndexing.has(article.indexing)) {
      fail(`${source}: indexing must be "index" or "noindex".`);
    }
    if (!allowedStatuses.has(article.status)) {
      fail(`${source}: status must be "draft", "reviewed", "published" or "archived".`);
    }
    if (!isValidDate(article.last_updated)) {
      fail(`${source}: last_updated must be a valid YYYY-MM-DD date.`);
    }
    if (!article.canonicalUrl || !article.canonicalUrl.startsWith(`${siteUrl}/parent-advice/`)) {
      fail(`${source}: canonical URL cannot be generated.`);
    }
  }

  for (const article of articles) {
    for (const relatedSlug of article.related || []) {
      if (!slugs.has(relatedSlug)) {
        fail(`${path.relative(rootDir, article.sourcePath)}: related slug "${relatedSlug}" does not exist.`);
      }
    }
  }
}

function buildCategoryPages(articles) {
  const categoryPages = [];

  for (const [category, label] of approvedCategories.entries()) {
    const categoryArticles = articles
      .filter((article) => article.category === category)
      .sort(sortNewestFirst);

    const canonicalPath = `/parent-advice/${category}/`;
    const canonicalUrl = `${siteUrl}${canonicalPath}`;
    const title = `${label} Parent Advice | Jothi Learning`;
    const description = categoryDescriptions.get(category) || `Parent advice from Jothi Learning on ${label.toLowerCase()} questions, study decisions and next steps.`;

    const content = `
    <section class="section-shell parent-advice-hero">
      <div class="wrap">
        ${breadcrumbHtml([
          ["/", "Home"],
          ["/parent-advice/", "Parent Advice"],
          [canonicalPath, label]
        ])}
        <div class="section-heading centered-heading">
          <p class="section-kicker">Parent Advice</p>
          <h1>${escapeHtml(label)}</h1>
          <p class="section-intro">${escapeHtml(description)}</p>
        </div>
      </div>
    </section>
    <section class="section-shell">
      <div class="wrap">
        ${articleCardGrid(categoryArticles)}
      </div>
    </section>`;

    writePage(
      templates.category,
      path.join(outputDir, category, "index.html"),
      {
        meta: metaTags({ title, description, canonicalUrl, type: "website", robots: "noindex,follow" }),
        jsonLd: jsonScript(breadcrumbJsonLd([
          [siteUrl, "Home"],
          [`${siteUrl}/parent-advice/`, "Parent Advice"],
          [canonicalUrl, label]
        ])),
        content
      }
    );

    categoryPages.push({ canonicalUrl, indexing: "noindex" });
  }

  return categoryPages;
}

function writeArticlePages(articles) {
  for (const article of articles) {
    const relatedArticles = resolveRelatedArticles(article, articles);
    const relatedReadingArticles = resolveRelatedReadingArticles(article, articles);
    const { shortAnswer, bodyMarkdown } = splitShortAnswer(article.body);
    const readingTime = readingTimeLabel(article.body);
    const title = `${article.title} | Jothi Learning`;
    const robots = article.indexing === "noindex" ? "noindex,follow" : "";
    activeArticleReadingTime = readingTime;
    const content = `
    <section class="section-shell parent-advice-hero">
      <div class="wrap narrow-shell">
        ${breadcrumbHtml([
          ["/", "Home"],
          ["/parent-advice/", "Parent Advice"],
          [`/parent-advice/${article.category}/`, article.category_label],
          [article.canonicalPath, article.title]
        ])}
        <div class="section-heading">
          <p class="section-kicker">${escapeHtml(article.category_label)}</p>
          <h1>${escapeHtml(article.title)}</h1>
          <p class="section-intro">${escapeHtml(article.description)}</p>
          <p class="parent-advice-meta">Reviewed by ${escapeHtml(article.reviewed_by || article.author)} · Last updated ${formatDate(article.last_updated)}</p>
        </div>
      </div>
    </section>
    <section class="section-shell">
      <div class="wrap parent-advice-layout">
        <article class="content-panel parent-advice-article">
          <div class="parent-advice-short-answer">
            <h2>Short answer</h2>
            <p>${renderInline(shortAnswer)}</p>
          </div>
          <div class="parent-advice-prose">
            ${renderMarkdown(bodyMarkdown)}
          </div>
          ${relatedReadingHtml(relatedReadingArticles)}
        </article>
        <aside class="parent-advice-sidebar" aria-label="Article actions">
          ${ctaHtml()}
          ${relatedHtml(relatedArticles)}
        </aside>
      </div>
    </section>`;

    writePage(
      templates.article,
      article.outputPath,
      {
        meta: metaTags({
          title,
          description: article.description,
          canonicalUrl: article.canonicalUrl,
          type: "article",
          robots
        }),
        jsonLd: [
          jsonScript(articleJsonLd(article)),
          jsonScript(breadcrumbJsonLd([
            [siteUrl, "Home"],
            [`${siteUrl}/parent-advice/`, "Parent Advice"],
            [`${siteUrl}/parent-advice/${article.category}/`, article.category_label],
            [article.canonicalUrl, article.title]
          ]))
        ].join("\n  "),
        content
      }
    );
    activeArticleReadingTime = "";
  }
}

function writeIndexPage(articles) {
  const canonicalUrl = `${siteUrl}/parent-advice/`;
  const title = "Parent Advice | Jothi Learning";
  const description = "Clear parent guidance from Jothi Learning on Maths, Science, GCSE choices, confidence and school decisions.";
  const categories = [...approvedCategories.entries()]
    .filter(([slug]) => slug !== "maths-confidence");
  const content = `
    <section class="section-shell parent-advice-hero">
      <div class="wrap">
        ${breadcrumbHtml([
          ["/", "Home"],
          ["/parent-advice/", "Parent Advice"]
        ])}
        <div class="section-heading centered-heading">
          <h1>Parent Advice Library</h1>
          <p class="section-intro">${escapeHtml(description)}</p>
        </div>
      </div>
    </section>
    <section class="section-shell">
      <div class="wrap">
        <div class="parent-advice-card-grid">
          ${categories.map(([slug, label]) => categoryCard(slug, label, articles)).join("\n")}
        </div>
      </div>
    </section>
    <section class="section-shell alt-shell">
      <div class="wrap">
        <div class="section-heading centered-heading">
          <h2>Parent advice articles</h2>
        </div>
        ${articleCardGrid(articles.sort(sortNewestFirst))}
      </div>
    </section>`;

  writePage(
    templates.index,
    path.join(outputDir, "index.html"),
    {
      meta: metaTags({ title, description, canonicalUrl, type: "website", robots: "" }),
      jsonLd: jsonScript(breadcrumbJsonLd([
        [siteUrl, "Home"],
        [canonicalUrl, "Parent Advice"]
      ])),
      content
    }
  );
}

function writeSitemap(articles, categoryPages) {
  const existingUrls = new Set(readExistingSitemapUrls());
  for (const url of requiredCoreUrls) {
    if (!existingUrls.has(url)) {
      fail(`Existing sitemap is missing required core URL ${url}. Refusing to generate sitemap.`);
    }
  }

  const nextUrls = new Set(existingUrls);
  nextUrls.add(`${siteUrl}/parent-advice/`);
  for (const article of articles) {
    if (article.status === "published" && article.indexing === "index") {
      nextUrls.add(article.canonicalUrl);
    }
  }
  for (const page of categoryPages) {
    if (page.indexing === "index") {
      nextUrls.add(page.canonicalUrl);
    }
  }

  for (const url of requiredCoreUrls) {
    if (!nextUrls.has(url)) {
      fail(`Sitemap generation would remove existing core page ${url}.`);
    }
  }

  const urls = [...nextUrls].sort((a, b) => requiredCoreUrls.indexOf(b) - requiredCoreUrls.indexOf(a)).sort(coreUrlSort);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`).join("\n")}\n</urlset>\n`;
  fs.writeFileSync(sitemapPath, xml, "utf8");
}

function resolveRelatedArticles(article, articles) {
  const bySlug = new Map(articles.map((item) => [item.slug, item]));
  if (article.related && article.related.length) {
    return article.related.map((slug) => bySlug.get(slug));
  }

  return articles
    .filter((item) => item.slug !== article.slug && item.category === article.category && item.status !== "archived")
    .sort(sortNewestFirst)
    .slice(0, 3);
}

function resolveRelatedReadingArticles(article, articles) {
  if (!Array.isArray(article.related_reading) || !article.related_reading.length) {
    return [];
  }

  const bySlug = new Map(articles.map((item) => [item.slug, item]));
  const seen = new Set();
  const relatedArticles = [];

  for (const slug of article.related_reading) {
    if (seen.has(slug)) {
      continue;
    }
    seen.add(slug);

    const relatedArticle = bySlug.get(slug);
    if (!relatedArticle) {
      fail(`${article.source}: related_reading references unknown article slug "${slug}".`);
    }
    if (relatedArticle.status !== "published" || relatedArticle.indexing !== "index") {
      fail(`${article.source}: related_reading article "${slug}" must be published and indexable.`);
    }
    relatedArticles.push(relatedArticle);
  }

  return relatedArticles;
}

function articleCardGrid(articles) {
  if (!articles.length) {
    return `<div class="content-panel parent-advice-empty"><p>No articles in this category yet.</p></div>`;
  }

  return `<div class="parent-advice-card-grid">
    ${articles.map(articleCard).join("\n")}
  </div>`;
}

function articleCard(article) {
  return `<a class="content-panel parent-advice-card parent-advice-article-card" href="${escapeHtml(article.canonicalPath)}">
      <p class="card-tag">${escapeHtml(article.category_label)}</p>
      <h2>${escapeHtml(article.title)}</h2>
      <p>${escapeHtml(article.description)}</p>
      <p class="parent-advice-meta">Last updated ${formatDate(article.last_updated)}</p>
    </a>`;
}

function categoryCard(slug, label, articles) {
  const count = articles.filter((article) => article.category === slug).length;
  const description = categoryDescriptions.get(slug) || "Clear parent guidance from Jothi Learning.";
  return `<a class="content-panel parent-advice-card parent-advice-category-card" href="/parent-advice/${slug}/">
      <p class="card-tag">${count} article${count === 1 ? "" : "s"}</p>
      <h2>${escapeHtml(label)}</h2>
      <p>${escapeHtml(description)}</p>
    </a>`;
}

function relatedHtml(articles) {
  if (!articles.length) {
    return "";
  }

  return `<div class="content-panel parent-advice-related">
      <h2>Related questions</h2>
      <ul>
        ${articles.map((article) => `<li><a href="${escapeHtml(article.canonicalPath)}">${escapeHtml(article.title)}</a></li>`).join("\n")}
      </ul>
    </div>`;
}

function relatedReadingHtml(articles) {
  if (!articles.length) {
    return "";
  }

  return `<div class="content-panel parent-advice-related parent-advice-related-reading">
      <h2>Related reading</h2>
      <ul>
        ${articles.map((article) => `<li><a href="${escapeHtml(article.canonicalPath)}">${escapeHtml(article.title)}</a></li>`).join("\n")}
      </ul>
    </div>`;
}

function ctaHtml() {
  return `<div class="content-panel parent-advice-cta">
      <h2>Need a clearer next step?</h2>
      <p>Tell us your child's year group, subject and current concern. We will help you decide the most sensible route.</p>
      <div class="parent-advice-cta-actions">
        <a class="button button-whatsapp" href="${whatsAppHref}" target="_blank" rel="noopener noreferrer">${whatsAppIcon(18)} WhatsApp us</a>
        <a class="button button-secondary" href="/contact.html#contact-form">Start with a consultation</a>
      </div>
    </div>`;
}

function metaTags({ title, description, canonicalUrl, type, robots }) {
  return `<title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${robots ? `<meta name="robots" content="${escapeHtml(robots)}" />` : ""}
  <meta name="theme-color" content="#10233f" />
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="${escapeHtml(type)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="Jothi Learning" />
  <meta property="og:locale" content="en_GB" />
  <meta property="og:image" content="${siteUrl}/assets/img/social/jothi-og-home.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="1200" />
  <meta property="og:image:alt" content="Jothi Learning parent advice" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${siteUrl}/assets/img/social/jothi-og-home.png" />`;
}

function articleJsonLd(article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Organization",
      name: article.author || "Jothi Learning"
    },
    publisher: {
      "@type": "EducationalOrganization",
      name: "Jothi Learning",
      url: siteUrl
    },
    mainEntityOfPage: article.canonicalUrl,
    dateModified: article.last_updated
  };
}

function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([url, name], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: url
    }))
  };
}

function breadcrumbHtml(items) {
  return `<nav class="parent-advice-breadcrumb" aria-label="Breadcrumb">
      ${items.map(([href, label], index) => {
        const isLast = index === items.length - 1;
        return isLast
          ? `<span aria-current="page">${escapeHtml(label)}</span>`
          : `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
      }).join("<span aria-hidden=\"true\">/</span>")}
    </nav>`;
}

function splitShortAnswer(markdown) {
  const blocks = markdown.trim().split(/\n{2,}/);
  const firstParagraphIndex = blocks.findIndex((block) => {
    const trimmed = block.trim();
    return trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("- ");
  });
  if (firstParagraphIndex === -1) {
    fail("Article body must include a short answer paragraph.");
  }

  const shortAnswer = blocks[firstParagraphIndex].trim();
  blocks.splice(firstParagraphIndex, 1);
  return {
    shortAnswer,
    bodyMarkdown: blocks.join("\n\n")
  };
}

function readingTimeLabel(markdown) {
  const wordCount = countWords(markdown);
  const minutes = Math.max(2, Math.round(wordCount / 225));
  return `${minutes} min read`;
}

function countWords(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_\-]/g, " ");
  const words = text.match(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)?/gu);
  return words ? words.length : 0;
}

function renderMarkdown(markdown) {
  const blocks = markdown.trim().split(/\n{2,}/).filter(Boolean);
  const html = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.startsWith("### ")) {
      html.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      html.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      html.push(`<h2>${renderInline(trimmed.slice(2))}</h2>`);
    } else if (trimmed.startsWith("- ")) {
      const items = trimmed.split("\n").map((line) => line.replace(/^- /, "").trim());
      html.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    } else {
      html.push(`<p>${renderInline(trimmed.replace(/\n/g, " "))}</p>`);
    }
  }

  return html.join("\n");
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
}

function parseFrontMatter(raw, filePath) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    fail(`${path.relative(rootDir, filePath)}: missing front matter block.`);
  }

  return {
    data: parseYaml(match[1], filePath),
    body: match[2].trim()
  };
}

function parseYaml(yaml, filePath) {
  const data = {};
  const lines = yaml.split(/\r?\n/);
  let currentKey = "";

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const listMatch = line.match(/^\s+-\s+"?(.+?)"?\s*$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(listMatch[1]);
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/);
    if (!keyValueMatch) {
      fail(`${path.relative(rootDir, filePath)}: unsupported front matter line "${line}".`);
    }
    currentKey = keyValueMatch[1];
    const rawValue = keyValueMatch[2] ?? "";
    if (rawValue === "") {
      data[currentKey] = [];
    } else {
      data[currentKey] = rawValue.replace(/^"|"$/g, "");
    }
  }

  return data;
}

function writePage(template, outputPath, replacements) {
  const html = template
    .replace("{{meta}}", replacements.meta)
    .replace("{{jsonLd}}", replacements.jsonLd)
    .replace("{{header}}", sharedHeader)
    .replace("{{content}}", replacements.content)
    .replace("{{footer}}", sharedFooter)
    .replace("{{whatsAppFloat}}", whatsAppFloat);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, "utf8");
}

function readExistingSitemapUrls() {
  const xml = readFile(sitemapPath);
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
}

function listMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listMarkdownFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function jsonScript(data) {
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
}

function whatsAppIcon(size) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.570-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.857L.057 23.998l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.214-3.733.979 1.004-3.642-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>`;
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function required(value, field, source) {
  if (!value) {
    fail(`${source}: ${field} is required.`);
  }
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function formatDate(value) {
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
  return activeArticleReadingTime ? `${formattedDate} · ${activeArticleReadingTime}` : formattedDate;
}

function sortNewestFirst(a, b) {
  return b.last_updated.localeCompare(a.last_updated) || a.title.localeCompare(b.title);
}

function coreUrlSort(a, b) {
  const aIndex = requiredCoreUrls.indexOf(a);
  const bIndex = requiredCoreUrls.indexOf(b);
  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }
  if (aIndex !== -1) {
    return -1;
  }
  if (bIndex !== -1) {
    return 1;
  }
  return a.localeCompare(b);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function fail(message) {
  throw new Error(message);
}
