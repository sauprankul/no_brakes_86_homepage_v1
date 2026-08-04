export const direct = [
  { id: 'article-direct', title: 'Brake Notes', subtitle: 'Street and track', type: 'Article', tags: ['brakes', 'track'], date: '2026-03-04', hasArticle: true, published: false },
  { id: 'index-direct', title: 'Setup collection', subtitle: 'A folder page', type: 'Index', tags: ['setup'], date: '2026-02-02', hasArticle: false, published: true },
];

export const descendants = [
  ...direct,
  { id: 'article-nested', title: 'Tire Pressures', subtitle: 'Cold and hot', type: 'Article', tags: ['tires', 'setup'], date: '2026-04-01', hasArticle: true, published: true },
  { id: 'draft-nested', title: 'Draft Alignment', subtitle: 'Current work', tags: ['setup', 'alignment'], updatedAt: '2026-05-06T12:00:00Z', hasArticle: true, published: false },
];
