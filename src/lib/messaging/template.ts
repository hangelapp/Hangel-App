/**
 * Şablon değişken render'ı: {ad}, {stk_adi} gibi placeholder'ları değerlerle değiştirir.
 * Tanımsız değişkenler boş bırakılır; bilinmeyen placeholder'lar olduğu gibi kalır.
 */

const VAR_TOKEN = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

export function extractVariables(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(VAR_TOKEN)) {
    found.add(match[1]);
  }
  return [...found];
}

export function render(body: string, vars: Record<string, string | undefined | null>): string {
  return body.replace(VAR_TOKEN, (full, key) => {
    const value = vars[key];
    if (value === undefined) return full;
    if (value === null) return '';
    return String(value);
  });
}

export function validateTemplate(body: string, declared: string[]): {
  ok: boolean;
  missingInBody: string[];
  undeclaredInBody: string[];
} {
  const inBody = new Set(extractVariables(body));
  const declaredSet = new Set(declared);
  const missingInBody: string[] = [];
  const undeclaredInBody: string[] = [];

  for (const d of declared) {
    if (!inBody.has(d)) missingInBody.push(d);
  }
  for (const b of inBody) {
    if (!declaredSet.has(b)) undeclaredInBody.push(b);
  }

  return {
    ok: missingInBody.length === 0 && undeclaredInBody.length === 0,
    missingInBody,
    undeclaredInBody,
  };
}
