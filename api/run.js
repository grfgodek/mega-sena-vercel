// api/run.js
import { Client } from '@notionhq/client';

// Configurações do Notion
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.DATABASE_ID;

// Função handler do Vercel
export default async function handler(req, res) {
  try {
    // Chamada para a API da Mega-Sena
    const response = await fetch('https://brainn-api-loterias.herokuapp.com/api/v1/mega-sena/latest');
    const data = await response.json();

    // Preparar dados para enviar ao Notion
    const concurso = data.concurso;
    const dataSorteio = data.data; // já no formato YYYY-MM-DD
    const dezenas = data.dezenas.join(', ');
    const acumulou = data.acumulou;
    const premiacoes = data.premiacoes
      .map(p => `${p.descricao}: ${p.ganhadores} ganhador(es), R$ ${p.valorPremio.toLocaleString('pt-BR')}`)
      .join('; ');

    // Criar página no Notion
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

    // Retorno de sucesso
    res.status(200).json({ success: true, message: `Resultado do concurso ${concurso} adicionado ao Notion!` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
