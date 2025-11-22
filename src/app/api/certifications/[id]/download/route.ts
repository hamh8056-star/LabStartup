import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { listCertifications } from "@/lib/evaluations-db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Récupérer la certification
  const certifications = await listCertifications()
  const certification = certifications.find(cert => cert.id === id)

  if (!certification) {
    return NextResponse.json({ message: "Certification introuvable." }, { status: 404 })
  }

  // Générer un certificat HTML stylisé
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificat - ${certification.owner}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .certificate {
      background: white;
      padding: 60px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 800px;
      text-align: center;
      border: 8px solid #667eea;
    }
    .header {
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 48px;
      color: #667eea;
      margin-bottom: 10px;
      font-weight: bold;
    }
    .header p {
      font-size: 18px;
      color: #666;
    }
    .badge {
      font-size: 32px;
      color: #764ba2;
      font-weight: bold;
      margin: 30px 0;
      text-transform: capitalize;
    }
    .recipient {
      font-size: 36px;
      color: #333;
      margin: 30px 0;
      font-weight: 600;
    }
    .details {
      margin: 40px 0;
      padding: 30px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    .details p {
      font-size: 18px;
      color: #555;
      margin: 10px 0;
    }
    .score {
      font-size: 48px;
      color: #667eea;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #eee;
      font-size: 14px;
      color: #999;
    }
    .cert-id {
      font-family: monospace;
      font-size: 12px;
      color: #999;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>🎓 Certificat de Réussite</h1>
      <p>Plateforme Taalimia</p>
    </div>
    
    <div class="badge">Badge: ${certification.badge === "explorateur" ? "Explorateur" : certification.badge === "innovateur" ? "Innovateur" : "Mentor"}</div>
    
    <div class="recipient">${certification.owner}</div>
    
    <div class="details">
      <p><strong>Simulation:</strong> ${certification.simulationTitle}</p>
      <p><strong>Discipline:</strong> ${certification.discipline}</p>
      <div class="score">Score: ${certification.score}/100</div>
    </div>
    
    <div class="footer">
      <p>Émis le ${new Date(certification.issuedAt).toLocaleDateString("fr-FR", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })}</p>
      <div class="cert-id">ID: ${certification.id}</div>
    </div>
  </div>
</body>
</html>
  `

  // Retourner le HTML pour téléchargement
  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="certificat-${certification.id}.html"`,
    },
  })
}

