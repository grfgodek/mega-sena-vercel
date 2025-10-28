import fetch from 'node-fetch';

export default async function handler(req, res) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.DATABASE_ID;

  // 1️⃣ Pegar resultado da Mega-Sena
  const megaRes = await fetch("https://loteriascaixa-api.herokuapp.com/api/megasena/latest");
  const data = await megaRes.json();

  const concurso = data.concurso;
  const dataSorteio = data.data; // "25/10/2025"
  const dezenas = data.dezenas.join(", ");
  const acumulou = data.acumulou;
  const premiacao = data.premiacoes.length > 0 ? data.premiacoes[0].descricao : "Sem dados";

  // 2️⃣ Enviar para o Notion
  const notionUrl = "https://api.notion.com/v1/pages";
  const payload = {
    parent: { database_id: DATABASE_ID },
    properties: {
      Concurso: { number: concurso },
      Data: { date: { start: dataSorteio.split("/").reverse().join("-") } },
      Dezenas: { rich_text: [{ text: { content: dezenas } }] },
      Acumulou: { checkbox: acumulou },
      Premiação: { rich_text: [{ text: { content: premiacao } }] }
    }
  };

  const notionRes = await fetch(notionUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (notionRes.ok) {
    res.status(200).send(`✅ Resultado do concurso ${concurso} adicionado ao Notion!`);
  } else {
    const text = await notionRes.text();
    res.status(500).send(`❌ Erro ao enviar para Notion: ${text}`);
  }
}


