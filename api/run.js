import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.DATABASE_ID;

export default async function handler(req, res) {
  try {
    // Fetch nativo do Node
    const response = await fetch('https://brainn-api-loterias.herokuapp.com/api/v1/mega-sena/latest');
    const data = await response.json();

    const concurso = data.concurso;
    const dataSorteio = data.data; // YYYY-MM-DD
    const dezenas = data.dezenas.join(', ');
    const acumulou = data.acumulou;
    const premiacoes = data.premiacoes
      .map(p => `${p.descricao}: ${p.ganhadores} ganhador(es), R$ ${p.valorPremio.toLocaleString('pt-BR')}`)
      .join('; ');

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Concurso: { number: concurso },
        Data: { date: { start: dataSorteio } },
        Dezenas: { rich_text: [{ text: { content: dezenas } }] },
        Acumulou: { checkbox: acumulou },
        Premiação: { rich_text: [{ text: { content: premiacoes } }] },
      },
    });

    res.status(200).json({ success: true, message: `Resultado do concurso ${concurso} adicionado ao Notion!` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
