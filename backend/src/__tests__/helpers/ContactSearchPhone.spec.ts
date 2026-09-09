import {
  buildPhoneCandidates,
  FULL_NUMBER_MIN_DIGITS
} from "../../helpers/ContactSearchPhone";

describe("buildPhoneCandidates", () => {
  it("encontra contato gravado com 13 dígitos quando digitam 12", () => {
    // gravado: 5516993771234 (com o nono dígito)
    expect(buildPhoneCandidates("551693771234")).toContain("5516993771234");
  });

  it("encontra contato gravado com 12 dígitos quando digitam 13", () => {
    // gravado: 554491446122 (sem o nono dígito)
    expect(buildPhoneCandidates("5544991446122")).toContain("554491446122");
  });

  it("encontra contato gravado sem DDI quando digitam sem DDI", () => {
    expect(buildPhoneCandidates("51993771234")).toContain("51993771234");
  });

  it("encontra contato gravado com DDI quando digitam sem DDI", () => {
    expect(buildPhoneCandidates("16993771234")).toContain("5516993771234");
  });

  it("mantém número estrangeiro intocado entre os candidatos", () => {
    expect(buildPhoneCandidates("351966346330")).toContain("351966346330");
    expect(buildPhoneCandidates("2348072498563")).toContain("2348072498563");
  });

  it("respeita a regra de DDD ao gerar a variante do WhatsApp", () => {
    // DDD 11 (começa com 1) mantém o nono dígito na variante wphone
    expect(buildPhoneCandidates("5511987654321")).toContain("5511987654321");
    // DDD 44 com dígito >= 6 após o nono gera também a forma sem o nono
    expect(buildPhoneCandidates("5544991446122")).toContain("554491446122");
  });

  it("sempre inclui a forma digitada", () => {
    const digitada = "5573981751261";
    expect(buildPhoneCandidates(digitada)).toContain(digitada);
  });

  it("não gera candidatos duplicados", () => {
    const candidatos = buildPhoneCandidates("5511987654321");
    expect(candidatos.length).toBe(new Set(candidatos).size);
  });

  it("trata números completos a partir de 10 dígitos", () => {
    expect(FULL_NUMBER_MIN_DIGITS).toBe(10);
  });
});
