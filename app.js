const formatTags = (tags) => tags.map((tag) => `<span class="tag">${tag}</span>`).join("");

const frameworkGrid = document.querySelector("#frameworkGrid");
frameworkGrid.innerHTML = window.siteData.concepts
  .map(
    (concept) => `
      <article class="card">
        <div class="tag-row">${formatTags(concept.tags)}</div>
        <h3>${concept.title}</h3>
        <p class="muted">${concept.summary}</p>
        <strong>${concept.question}</strong>
      </article>
    `,
  )
  .join("");

const workflowList = document.querySelector("#workflowList");
workflowList.innerHTML = window.siteData.workflow
  .map(
    (item, index) => `
      <article class="timeline-item" data-step="${index + 1}">
        <h3>${item.title}</h3>
        <p class="muted">${item.description}</p>
      </article>
    `,
  )
  .join("");

const companyGrid = document.querySelector("#companyGrid");
companyGrid.innerHTML = window.siteData.companies
  .map(
    (company) => `
      <article class="company-card">
        <div>
          <p class="eyebrow">${company.ticker}</p>
          <h3>${company.name}</h3>
        </div>
        <p class="muted">${company.thesis}</p>
        <ul class="metric-list">
          ${company.metrics.map((metric) => `<li>${metric}</li>`).join("")}
        </ul>
      </article>
    `,
  )
  .join("");

const bookList = document.querySelector("#bookList");
bookList.innerHTML = window.siteData.books
  .map(
    (book) => `
      <article class="list-item">
        <h3>${book.title}</h3>
        <p class="muted">${book.note}</p>
      </article>
    `,
  )
  .join("");

const richDadPoints = document.querySelector("#richDadPoints");
richDadPoints.innerHTML = window.siteData.richDadPrinciples
  .map(
    (point) => `
      <article class="principle-card">
        <h3>${point.title}</h3>
        <p class="muted">${point.body}</p>
      </article>
    `,
  )
  .join("");

const insightList = document.querySelector("#insightList");
insightList.innerHTML = window.siteData.insights
  .map(
    (insight) => `
      <article class="list-item">
        <p class="eyebrow">${insight.date}</p>
        <h3>${insight.title}</h3>
        <p class="muted">${insight.body}</p>
      </article>
    `,
  )
  .join("");
