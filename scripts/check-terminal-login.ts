/**
 * Diagnóstico READ-ONLY de login de terminal (kiosk /survey).
 *
 * Uso:
 *   npx tsx scripts/check-terminal-login.ts                 # lista os terminais
 *   npx tsx scripts/check-terminal-login.ts <email> <senha> # testa um login
 *
 * Requer DATABASE_URL (e, por segurança, DIRECT_URL) apontando para o MESMO
 * banco usado pelo deploy. Nada é alterado no banco.
 */
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

// Mesma normalização usada no login (src/server/terminal-email.ts).
function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase().replace(/\s+/g, "");
}

// Mesmo parser do backend (src/server/deps.ts), aceita CSV e JSON array.
function parseCampaignList(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((c: any) => typeof c === "string");
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter((c: any) => typeof c === "string");
    } catch {
      // cai no split por vírgula
    }
  }
  return trimmed.split(",").map((c: string) => c.trim()).filter(Boolean);
}

function hashInfo(password: string | null) {
  if (!password) return "NULL/vazia";
  const isBcrypt = password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
  return `${isBcrypt ? "bcrypt" : "TEXTO PURO/outro formato"} (${password.slice(0, 7)}..., ${password.length} chars)`;
}

async function checkPassword(stored: string | null, plain: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

async function listTerminals() {
  const terminals = await prisma.terminal.findMany({
    orderBy: { created_at: "desc" },
    select: { id: true, name: true, email: true, status: true, created_at: true, password: true, user_id: true },
  });

  console.log(`Total de terminais no banco: ${terminals.length}\n`);
  for (const t of terminals) {
    console.log(`- ${t.name}`);
    console.log(`  id:      ${t.id}`);
    console.log(`  email:   ${JSON.stringify(t.email)}`);
    console.log(`  status:  ${t.status}`);
    console.log(`  senha:   ${hashInfo(t.password)}`);
    console.log(`  criado:  ${t.created_at.toISOString()}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não definida. Exporte a mesma URL usada no Coolify.");
    process.exit(1);
  }

  const emailArg = process.argv[2] || "";
  const passwordArg = process.argv[3] || "";

  if (!emailArg) {
    await listTerminals();
    return;
  }

  const normalized = normalizeEmail(emailArg);

  console.log("=== E-mail informado ===");
  console.log(`original:    ${JSON.stringify(emailArg)}`);
  console.log(`normalizado: ${JSON.stringify(normalized)}\n`);

  // 1) Busca exata (como o login faz)
  const exact = await prisma.terminal.findFirst({ where: { email: normalized } });

  // 2) Busca case-insensitive / com espaços, para detectar dados legados
  const loose = await prisma.terminal.findMany({
    where: { email: { equals: normalized, mode: "insensitive" } },
  });

  const candidates = exact ? [exact] : loose;

  if (candidates.length === 0) {
    console.log("❌ Nenhum terminal encontrado com esse e-mail (exato ou case-insensitive).");
    console.log("   => É esta a causa do 401. O terminal não existe no banco atual.");
    console.log("   Confira se você está no banco/ambiente certo (totem x vitrine) e se o e-mail não foi renomeado.\n");
    await listTerminals();
    return;
  }

  if (!exact && loose.length > 0) {
    console.log("⚠️  O terminal existe, mas o e-mail NÃO bate exatamente (maiúsculas/espaços).");
    console.log("   O login normaliza para minúsculas, então esse registro pode nunca autenticar.\n");
  }

  for (const terminal of candidates) {
    console.log("=== Terminal encontrado ===");
    console.log(`id:      ${terminal.id}`);
    console.log(`nome:    ${terminal.name}`);
    console.log(`email:   ${JSON.stringify(terminal.email)}`);
    console.log(`status:  ${terminal.status}`);
    console.log(`senha:   ${hashInfo(terminal.password)}`);

    const owner = await prisma.user.findUnique({ where: { id: terminal.user_id } });
    console.log("\n=== Dono do terminal ===");
    if (!owner) {
      console.log("❌ Usuário dono não existe (terminal órfão). O login retorna 403.");
    } else {
      console.log(`email:      ${JSON.stringify(owner.email)}`);
      console.log(`status:     ${owner.status}`);
      console.log(`plano:      ${owner.plano}`);
      console.log(`vencimento: ${JSON.stringify(owner.vencimento)}`);
      if (owner.plano === "Teste 7 dias" && owner.vencimento) {
        const expiration = new Date(owner.vencimento);
        const validDate = !Number.isNaN(expiration.getTime());
        console.log(
          `trial:      ${validDate ? (new Date() > expiration ? "EXPIRADO" : "válido") : "vencimento inválido (checagem ignorada)"}`,
        );
      }
    }

    const names = parseCampaignList(terminal.campaigns);
    console.log("\n=== Campanhas vinculadas (nomes salvos) ===");
    console.log(names.length ? names.map((n) => `- ${n}`).join("\n") : "(nenhuma)");

    const campaigns = await prisma.campaign.findMany({
      where: { user_id: terminal.user_id },
      select: { id: true, name: true, status: true },
      orderBy: { created_at: "desc" },
    });
    const activeMatches = campaigns.filter((c) => c.status === "Ativo" && names.includes(c.name));
    console.log("\n=== Campanhas ativas que o /survey aceitaria ===");
    console.log(
      activeMatches.length
        ? activeMatches.map((c) => `- ${c.name} (${c.id})`).join("\n")
        : "❌ nenhuma — o login pode autenticar e voltar para a tela de login",
    );

    if (passwordArg) {
      const ok = await checkPassword(terminal.password, passwordArg);
      console.log("\n=== Teste da senha ===");
      console.log(ok ? "✅ a senha informada CONFERE com o hash do banco." : "❌ a senha informada NÃO confere com o hash do banco.");
      if (ok) {
        console.log("   Se o HTTP ainda dá 401, o e-mail enviado pelo navegador é diferente do que você passou aqui.");
      } else {
        console.log("   Use o botão 'Redefinir Senha' no painel e copie a senha gerada imediatamente.");
      }
    } else {
      console.log("\n(dica: passe a senha como 2º argumento para testar o bcrypt)");
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
