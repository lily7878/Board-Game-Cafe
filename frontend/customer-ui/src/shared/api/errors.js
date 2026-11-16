/**
 * Turns an ApiError into the Romanian message a customer should read.
 * Core's ProblemDetail texts are English and technical, so known statuses get our own wording.
 */
export function describeError(error) {
  if (!error) return 'A apărut o eroare.';
  if (error.kind === 'timeout') return 'Nu am primit confirmarea. Verifică înainte să încerci din nou.';
  if (error.kind === 'network') return 'Nu ne-am putut conecta. Verifică conexiunea la internet.';
  switch (error.status) {
    case 401:
      return 'Accesul la masă s-a încheiat.';
    case 404:
      return 'Nu mai există. Am reîncărcat datele.';
    case 409:
      return 'Ceva s-a schimbat între timp. Am reîncărcat datele; verifică și încearcă din nou.';
    case 429:
      return `Prea multe încercări. Încearcă din nou${error.retryAfter ? ` peste ${error.retryAfter} s` : ' în câteva secunde'}.`;
    default:
      if (error.status >= 500) return 'Nu am primit confirmarea. Verifică înainte să încerci din nou.';
      return 'Acțiunea nu a putut fi efectuată.';
  }
}
