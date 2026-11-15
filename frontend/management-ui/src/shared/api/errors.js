/**
 * Turns an ApiError into the Romanian message staff should read (spec §10, HTTP errors).
 * Core's ProblemDetail texts are English and technical, so known statuses get our own wording.
 */
export function describeError(error) {
  if (!error) return 'A apărut o eroare.';
  if (error.kind === 'timeout') return 'Serverul nu a confirmat acțiunea. Verifică starea înainte să încerci din nou.';
  if (error.kind === 'network') return 'Nu ne-am putut conecta la server. Verifică conexiunea.';
  switch (error.status) {
    case 403:
      return 'Nu ai drepturi pentru această acțiune.';
    case 404:
      return 'Elementul nu mai există. Am reîncărcat datele.';
    case 409:
      return 'Starea s-a schimbat între timp. Am reîncărcat datele; verifică și încearcă din nou.';
    case 429:
      return `Prea multe cereri. Încearcă din nou${error.retryAfter ? ` peste ${error.retryAfter} s` : ' în câteva secunde'}.`;
    default:
      if (error.status >= 500) return 'Serverul nu a confirmat acțiunea. Verifică starea înainte să încerci din nou.';
      return error.detail ?? 'Acțiunea nu a putut fi efectuată.';
  }
}
