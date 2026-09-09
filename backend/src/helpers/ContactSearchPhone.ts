import normalizeWhatsAppPhone from "./NormalizePhone";

// A partir desta quantidade de dígitos a busca é tratada como um número
// completo e comparada exatamente contra as variantes conhecidas do contato.
// Abaixo disso a busca de telefone é parcial (LIKE).
export const FULL_NUMBER_MIN_DIGITS = 10;

/**
 * Monta todas as formas sob as quais um número pode estar armazenado.
 *
 * A base fica gravada de formas diferentes: com e sem o nono dígito, e parte
 * dela sem o DDI. Comparar apenas com a forma digitada não encontra o
 * contato, por isso a busca compara contra todas as variantes.
 *
 * As variantes brasileiras vêm do helper NormalizePhone, que aplica as regras
 * reais de numeração (inserção do nono dígito e a variante usada pelo
 * WhatsApp conforme o DDD). Números estrangeiros são devolvidos intocados por
 * aquele helper, e a forma digitada é sempre mantida entre os candidatos —
 * então um contato internacional é encontrado pelo seu número real.
 */
export function buildPhoneCandidates(digits: string): string[] {
  const seeds = digits.startsWith("55") ? [digits] : [digits, `55${digits}`];
  const candidates = new Set<string>();

  seeds.forEach(seed => {
    const { phone, wphone } = normalizeWhatsAppPhone(seed);
    candidates.add(seed);
    candidates.add(phone);
    candidates.add(wphone);
  });

  return Array.from(candidates);
}
