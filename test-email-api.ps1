# PowerShell script để test email API
# Chạy: .\test-email-api.ps1

Write-Host "🧪 Testing Email API..." -ForegroundColor Cyan
Write-Host ""

$body = @{
    userEmail = "test@example.com"
    doctorName = "Dr. Test"
    appointmentDate = "Monday, January 1, 2024"
    appointmentTime = "10:00 AM"
    appointmentType = "General Consultation"
    duration = "30 min"
    price = "$50"
} | ConvertTo-Json

Write-Host "📤 Sending request to: http://localhost:3000/api/send-appointment-email" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/send-appointment-email" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📄 Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error occurred!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host ""
    
    # Try to read error response
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "📄 Error Response:" -ForegroundColor Cyan
        $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Could not parse error response: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "- Kiểm tra terminal (nơi chạy npm run dev) để xem server logs" -ForegroundColor Gray
Write-Host "- Đảm bảo server đang chạy: npm run dev" -ForegroundColor Gray
Write-Host "- Kiểm tra .env.local có RESEND_API_KEY không" -ForegroundColor Gray

