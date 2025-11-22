# Script pour nettoyer le cache et redémarrer proprement

Write-Host "🧹 Nettoyage complet du projet..." -ForegroundColor Cyan

# 1. Arrêter les processus Node.js
Write-Host "`n📍 Arrêt des processus Node.js existants..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Supprimer le cache Next.js
Write-Host "`n🗑️ Suppression du cache Next.js (.next)..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cache Next.js supprimé" -ForegroundColor Green
} else {
    Write-Host "✅ Pas de cache à supprimer" -ForegroundColor Green
}

# 3. Nettoyer la base MongoDB
Write-Host "`n🔄 Nettoyage de la base MongoDB..." -ForegroundColor Yellow
npm run clean:labs

# 4. Redémarrer le serveur
Write-Host "`n🚀 Démarrage du serveur..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Serveur prêt !" -ForegroundColor Green
Write-Host "📍 Ouvrez: http://localhost:3000/dashboard/labs" -ForegroundColor Yellow
Write-Host "🔄 Dans le navigateur: CTRL+SHIFT+R pour vider le cache" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

npm run dev







