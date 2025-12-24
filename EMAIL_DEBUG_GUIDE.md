# Hướng dẫn Debug Email Gửi Không Được

## 🔍 Các bước kiểm tra

### Bước 1: Kiểm tra cấu hình cơ bản

1. **Kiểm tra file `.env.local` có tồn tại không:**
   ```bash
   # File phải ở thư mục gốc (cùng cấp với package.json)
   # Windows: D:\dental_as\.env.local
   ```

2. **Kiểm tra RESEND_API_KEY có trong file không:**
   ```bash
   # Mở file .env.local và kiểm tra có dòng:
   RESEND_API_KEY=re_your_api_key_here
   ```

3. **Lấy API key từ Resend:**
   - Truy cập: https://resend.com/api-keys
   - Đăng nhập vào tài khoản Resend
   - Tạo API key mới hoặc copy key hiện có
   - Key phải bắt đầu bằng `re_`

### Bước 2: Sử dụng Test Endpoint

Tôi đã tạo một endpoint test để kiểm tra cấu hình:

1. **Khởi động server:**
   ```bash
   npm run dev
   ```

2. **Mở trình duyệt và truy cập:**
   ```
   http://localhost:3000/api/test-email
   ```

3. **Xem kết quả:**
   - Nếu thấy `hasApiKey: false` → Chưa có API key trong .env.local
   - Nếu thấy `apiKeyFormat: "invalid"` → API key sai format
   - Nếu thấy `testEmailSent: true` → Email đã được gửi thành công
   - Nếu thấy `testError` → Có lỗi khi gửi email, xem chi tiết

### Bước 3: Kiểm tra Console Logs

Khi book appointment, mở **Developer Console** (F12) và kiểm tra:

1. **Trong Browser Console (F12 → Console tab):**
   - Tìm các log bắt đầu bằng `Email API response`
   - Nếu thấy `✅ Email sent successfully` → Email đã được gửi
   - Nếu thấy `⚠️ Email notification failed` → Có lỗi, xem chi tiết

2. **Trong Terminal (nơi chạy `npm run dev`):**
   - Tìm các log bắt đầu bằng `✅` hoặc `❌`
   - `✅ RESEND_API_KEY is configured` → API key đã được load
   - `✅ Email sent successfully!` → Email đã được gửi
   - `❌ RESEND_API_KEY is not configured` → Chưa có API key

### Bước 4: Kiểm tra Resend Dashboard

1. **Đăng nhập vào Resend Dashboard:**
   - Truy cập: https://resend.com/emails
   - Đăng nhập vào tài khoản

2. **Kiểm tra Logs:**
   - Vào tab "Logs" hoặc "Emails"
   - Xem danh sách email đã gửi
   - Kiểm tra status: `sent`, `delivered`, `bounced`, `failed`

3. **Nếu email có trong logs nhưng không nhận được:**
   - Kiểm tra **Spam/Junk folder**
   - Kiểm tra **Promotions tab** (nếu dùng Gmail)
   - Email từ `onboarding@resend.dev` thường bị Gmail chặn

### Bước 5: Các lỗi thường gặp

#### ❌ Lỗi: "RESEND_API_KEY is not configured"

**Nguyên nhân:** 
- File `.env.local` không tồn tại
- Hoặc không có dòng `RESEND_API_KEY` trong file
- Hoặc server chưa được restart sau khi thêm API key

**Cách khắc phục:**
1. Tạo file `.env.local` trong thư mục gốc
2. Thêm dòng: `RESEND_API_KEY=re_your_api_key_here`
3. **QUAN TRỌNG:** Restart server:
   ```bash
   # Dừng server (Ctrl+C)
   # Chạy lại
   npm run dev
   ```

#### ❌ Lỗi: "API key format is invalid"

**Nguyên nhân:**
- API key không bắt đầu bằng `re_`
- Hoặc có khoảng trắng/dấu ngoặc kép thừa

**Cách khắc phục:**
```bash
# ✅ ĐÚNG:
RESEND_API_KEY=re_1234567890abcdefghij

# ❌ SAI:
RESEND_API_KEY="re_123..."  # Có dấu ngoặc kép
RESEND_API_KEY= re_123...   # Có khoảng trắng
RESEND_API_KEY=re123...     # Không bắt đầu bằng re_
```

#### ❌ Lỗi: "Email sent but not received"

**Nguyên nhân:**
- Email bị chặn bởi spam filter
- Domain `resend.dev` chưa được verify
- Email vào spam folder

**Cách khắc phục:**
1. **Kiểm tra Spam folder** trước
2. **Verify domain trong Resend:**
   - Vào https://resend.com/domains
   - Add domain của bạn
   - Thêm DNS records (SPF, DKIM, DMARC)
   - Verify domain
3. **Cập nhật .env.local:**
   ```bash
   RESEND_FROM_EMAIL="DentWise <noreply@yourdomain.com>"
   RESEND_REPLY_TO_EMAIL="support@yourdomain.com"
   ```
4. **Restart server**

#### ❌ Lỗi: "Resend instance is null"

**Nguyên nhân:**
- API key có format sai
- Resend client không được khởi tạo đúng

**Cách khắc phục:**
1. Kiểm tra API key format (phải bắt đầu bằng `re_`)
2. Xóa file `.env.local` và tạo lại
3. Restart server

### Bước 6: Test thủ công

1. **Sử dụng test endpoint:**
   ```
   GET http://localhost:3000/api/test-email
   ```

2. **Hoặc test trực tiếp trong code:**
   - Mở file `src/app/api/send-appointment-email/route.ts`
   - Thêm console.log để debug
   - Book một appointment và xem logs

3. **Kiểm tra Resend API trực tiếp:**
   - Vào https://resend.com/emails
   - Xem có email nào được gửi không
   - Kiểm tra status và error messages

## 📋 Checklist Debug

- [ ] File `.env.local` tồn tại trong thư mục gốc
- [ ] `RESEND_API_KEY` có trong `.env.local`
- [ ] API key bắt đầu bằng `re_`
- [ ] API key không có khoảng trắng hoặc dấu ngoặc kép
- [ ] Server đã được restart sau khi thêm API key
- [ ] Test endpoint `/api/test-email` trả về `hasApiKey: true`
- [ ] Console logs hiển thị `✅ RESEND_API_KEY is configured`
- [ ] Resend dashboard có email trong logs
- [ ] Đã kiểm tra Spam folder
- [ ] Domain đã được verify (nếu dùng custom domain)

## 🚀 Quick Fix Commands

```bash
# 1. Kiểm tra file .env.local có tồn tại không
# Windows PowerShell:
Test-Path .env.local

# 2. Xem nội dung file (ẩn API key)
# Windows PowerShell:
Get-Content .env.local | Select-String "RESEND"

# 3. Restart server
# Dừng server (Ctrl+C) rồi chạy lại:
npm run dev
```

## 📞 Cần hỗ trợ thêm?

1. **Kiểm tra logs chi tiết:**
   - Browser Console (F12)
   - Terminal (nơi chạy npm run dev)
   - Resend Dashboard logs

2. **Chạy test endpoint:**
   - Mở: http://localhost:3000/api/test-email
   - Copy kết quả và gửi để được hỗ trợ

3. **Kiểm tra Resend Dashboard:**
   - Vào https://resend.com/emails
   - Xem logs và error messages
   - Copy error details nếu có

