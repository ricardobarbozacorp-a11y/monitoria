// Rotina diária de atividade do Supabase.
// Faz somente SELECT na tabela "monitores"; não grava nem altera dados.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization || "";

  // A Vercel envia este cabeçalho automaticamente quando CRON_SECRET
  // está configurado nas Environment Variables do projeto.
  if (!secret || authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      ok: false,
      error: "Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY na Vercel."
    });
  }

  try {
    // Consulta mínima, somente leitura, a uma tabela que o HTML já consulta.
    const endpoint =
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/monitores?select=id&limit=1`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    const body = await response.text();

    if (!response.ok) {
      console.error("Supabase heartbeat falhou:", response.status, body);
      return res.status(502).json({
        ok: false,
        error: "A consulta de leitura ao Supabase falhou.",
        supabase_status: response.status
      });
    }

    return res.status(200).json({
      ok: true,
      operation: "SELECT",
      table: "monitores",
      message: "Atividade de leitura realizada; nenhum registro foi alterado.",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro no heartbeat:", error);
    return res.status(500).json({ ok: false, error: "Falha na rotina de atividade." });
  }
}
