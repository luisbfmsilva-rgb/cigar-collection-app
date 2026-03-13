import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Cigar, Review, Humidor } from "@/lib/context/data-context";

export interface CollectionStats {
  totalCigars: number;
  totalHumidors: number;
  totalReviews: number;
  averageRating: number;
  cigarsSmoked: number;
  topRatedCigars: (Cigar & { avgRating: number })[];
  recentReviews: Review[];
}

export async function generateCollectionPDF(
  humidors: Humidor[],
  cigars: Cigar[],
  reviews: Review[],
  stats: CollectionStats
): Promise<string> {
  // Criar conteúdo HTML do PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          background: #fff;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #8B4513;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 32px;
          color: #8B4513;
          margin-bottom: 5px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #8B4513;
        }
        .stat-card h3 {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .stat-card .value {
          font-size: 28px;
          font-weight: bold;
          color: #8B4513;
        }
        .section {
          margin-bottom: 40px;
        }
        .section h2 {
          font-size: 20px;
          color: #8B4513;
          margin-bottom: 15px;
          border-bottom: 2px solid #8B4513;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background: #8B4513;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .humidor-item {
          background: #f9f9f9;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 5px;
          border-left: 3px solid #8B4513;
        }
        .humidor-item h4 {
          color: #8B4513;
          margin-bottom: 5px;
        }
        .humidor-item p {
          font-size: 12px;
          color: #666;
          margin: 3px 0;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 11px;
          color: #999;
        }
        .rating {
          color: #8B4513;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cigar Collection Manager</h1>
          <p>Relatório da Sua Coleção de Charutos</p>
          <p>${new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total de Charutos</h3>
            <div class="value">${stats.totalCigars}</div>
          </div>
          <div class="stat-card">
            <h3>Total de Umidores</h3>
            <div class="value">${stats.totalHumidors}</div>
          </div>
          <div class="stat-card">
            <h3>Charutos Fumados</h3>
            <div class="value">${stats.cigarsSmoked}</div>
          </div>
          <div class="stat-card">
            <h3>Avaliação Média</h3>
            <div class="value">${stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}</div>
          </div>
        </div>

        <div class="section">
          <h2>Umidores</h2>
          ${humidors.map((h) => {
            const cigarCount = cigars.filter((c) => c.humidorId === h.id).length;
            const capacity = h.capacity || 0;
            const percentage = capacity > 0 ? Math.round((cigarCount / capacity) * 100) : 0;
            return `
              <div class="humidor-item">
                <h4>${h.name}</h4>
                <p><strong>Tipo:</strong> ${h.type}</p>
                <p><strong>Charutos:</strong> ${cigarCount} / ${capacity} (${percentage}%)</p>
              </div>
            `;
          }).join("")}
        </div>

        ${stats.topRatedCigars.length > 0 ? `
          <div class="section">
            <h2>Charutos Melhor Avaliados</h2>
            <table>
              <thead>
                <tr>
                  <th>Marca</th>
                  <th>Vitola</th>
                  <th>Avaliação</th>
                </tr>
              </thead>
              <tbody>
                ${stats.topRatedCigars.slice(0, 5).map((c) => `
                  <tr>
                    <td>${c.brand} ${c.name}</td>
                    <td>${c.vitola}</td>
                    <td><span class="rating">${c.avgRating.toFixed(1)}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        ${stats.recentReviews.length > 0 ? `
          <div class="section">
            <h2>Reviews Recentes</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Charuto</th>
                  <th>Pontuação</th>
                </tr>
              </thead>
              <tbody>
                ${stats.recentReviews.slice(0, 10).map((r) => {
                  const cigar = cigars.find((c) => c.id === r.cigarId);
                  return `
                    <tr>
                      <td>${new Date(r.tastingDate).toLocaleDateString("pt-BR")}</td>
                      <td>${cigar?.brand} ${cigar?.name}</td>
                      <td><span class="rating">${r.finalScore}</span></td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <div class="footer">
          <p>Relatório gerado automaticamente pelo Cigar Collection Manager</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Salvar HTML como arquivo
    const fileName = `cigar-collection-${new Date().getTime()}.html`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, htmlContent);

    return filePath;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
}

export async function shareCollectionReport(filePath: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Compartilhamento não disponível neste dispositivo");
    }
    await Sharing.shareAsync(filePath);
  } catch (error) {
    console.error("Erro ao compartilhar:", error);
    throw error;
  }
}
