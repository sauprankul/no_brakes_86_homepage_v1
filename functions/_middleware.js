const US_ONLY_RESPONSE = 'This site is temporarily available only in the United States.';

export const onRequest = (context) => {
  if (context.request.cf?.country !== 'US') {
    return new Response(US_ONLY_RESPONSE, { status: 451, headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store' } });
  }
  return context.next();
};
