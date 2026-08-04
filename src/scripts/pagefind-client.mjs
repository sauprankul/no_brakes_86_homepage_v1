let pagefindPromise;

async function loadPagefind() {
  if (!pagefindPromise) {
    const runtimeUrl = '/pagefind/pagefind.js';
    pagefindPromise = import(/* @vite-ignore */ runtimeUrl).then(async (pagefind) => {
      await pagefind.options({ excerptLength: 11, ranking: { metaWeights: { title: 5, subtitle: 3 } } });
      await pagefind.init();
      return pagefind;
    });
  }
  return pagefindPromise;
}

export async function searchPagefindEntryIds(query) {
  try {
    const pagefind = await loadPagefind();
    const search = await pagefind.search(query);
    const results = await Promise.all(search.results.map((result) => result.data()));
    return results.map((result) => result.meta?.entry_id).filter(Boolean);
  } catch (error) {
    console.warn(`Full-text index unavailable; using the local article index instead. ${error.message}`);
    return null;
  }
}
