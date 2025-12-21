# Hướng dẫn cấu hình Resend Email

## Vấn đề: Email không được gửi hoặc không nhận được

### Bước 1: Kiểm tra RESEND_API_KEY

1. Mở file `.env.local` trong thư mục gốc của project
2. Thêm dòng sau (nếu chưa có):
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```
3. Lấy API key từ: https://resend.com/api-keys
4. **Quan trọng**: Khởi động lại server sau khi thêm API key:
   ```bash
   npm run dev
   ```

### Bước 2: Kiểm tra Domain Email (QUAN TRỌNG để tránh spam)

**Vấn đề hiện tại:**
- Code đang sử dụng domain test của Resend: `onboarding@resend.dev`
- Gmail và các email provider khác thường chặn email từ domain test này
- Để email không bị chặn, bạn **PHẢI** verify domain của mình

**Cách verify domain trong Resend:**

1. **Đăng nhập vào Resend Dashboard:**
   - Truy cập: https://resend.com/domains
   - Click "Add Domain"

2. **Thêm domain của bạn:**
   - Nhập domain (ví dụ: `yourdomain.com`)
   - Resend sẽ cung cấp các DNS records cần thêm

3. **Thêm DNS records vào domain provider:**
   - Đăng nhập vào domain provider (GoDaddy, Namecheap, Cloudflare, etc.)
   - Thêm các records mà Resend yêu cầu:
     - **SPF record** (TXT)
     - **DKIM record** (TXT) 
     - **DMARC record** (TXT)
   - Đợi DNS propagate (có thể mất 5-30 phút)

4. **Verify domain:**
   - Quay lại Resend dashboard
   - Click "Verify" để kiểm tra
   - Khi status chuyển sang "Verified" (màu xanh) là thành công

5. **Cấu hình trong .env.local:**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL="DentWise <noreply@yourdomain.com>"
   RESEND_REPLY_TO_EMAIL="support@yourdomain.com"
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

**Lưu ý:**
- Domain `resend.dev` chỉ dùng để test và có giới hạn
- Email từ domain chưa verify sẽ bị Gmail chặn với lỗi "unsolicited mail"
- Sau khi verify domain, email sẽ có tỷ lệ deliverability cao hơn nhiều

### Bước 3: Kiểm tra Console Logs

Khi book appointment, kiểm tra terminal để xem:
- ✅ "RESEND_API_KEY is configured" - API key đã được cấu hình
- ✅ "Email sent successfully, ID: xxx" - Email đã được gửi
- ❌ Nếu có lỗi, sẽ hiển thị chi tiết

### Bước 4: Kiểm tra Spam Folder

Email có thể bị chuyển vào thư mục Spam/Junk. Hãy kiểm tra:
- Inbox
- Spam/Junk folder
- Promotions tab (nếu dùng Gmail)

### Bước 5: Test với Resend Dashboard

1. Đăng nhập vào https://resend.com/emails
2. Kiểm tra tab "Logs" để xem email có được gửi không
3. Xem status của email (sent, delivered, bounced, etc.)

## Troubleshooting

### Lỗi: Gmail chặn email với "unsolicited mail" hoặc "Content Rejected"

**Nguyên nhân:** 
- Email bị Gmail phát hiện là spam/unsolicited
- Domain chưa được verify
- Thiếu plain text version
- Nội dung email trigger spam filter

**Cách khắc phục:**

1. **Verify domain (QUAN TRỌNG NHẤT):**
   - Xem hướng dẫn ở Bước 2 ở trên
   - Domain đã verify sẽ có SPF, DKIM, DMARC records
   - Email từ domain đã verify ít bị chặn hơn nhiều

2. **Kiểm tra email content:**
   - Code đã được cập nhật để loại bỏ emoji trong subject
   - Đã thêm plain text version
   - Đã thêm reply-to address
   - Đã cải thiện email structure

3. **Warm up domain (cho production):**
   - Nếu domain mới, nên gửi email từ từ để build reputation
   - Bắt đầu với vài email/ngày, tăng dần
   - Tránh gửi hàng loạt ngay từ đầu

4. **Kiểm tra Resend dashboard:**
   - Vào https://resend.com/emails
   - Xem logs để biết email có được gửi không
   - Kiểm tra bounce reason nếu có

### Lỗi: "Unable to fetch data. The request could not be resolved."

**Nguyên nhân:** API key không hợp lệ hoặc thiếu

**Cách khắc phục:**

1. **Kiểm tra file .env.local:**
   ```bash
   # Đảm bảo file .env.local tồn tại trong thư mục gốc
   # Nội dung file phải có dòng:
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

2. **Kiểm tra API key:**
   - API key phải bắt đầu bằng `re_`
   - Không có khoảng trắng hoặc dấu ngoặc kép thừa
   - Độ dài tối thiểu 20 ký tự
   - Ví dụ đúng: `RESEND_API_KEY=re_1234567890abcdefghij`
   - Ví dụ sai: `RESEND_API_KEY="re_123..."` (có dấu ngoặc kép)
   - Ví dụ sai: `RESEND_API_KEY= re_123...` (có khoảng trắng)

3. **Lấy API key mới:**
   - Truy cập: https://resend.com/api-keys
   - Đăng nhập vào tài khoản Resend
   - Tạo API key mới hoặc kiểm tra key hiện tại
   - Copy key và dán vào `.env.local`

4. **Khởi động lại server:**
   ```bash
   # Dừng server (Ctrl+C)
   # Chạy lại
   npm run dev
   ```

5. **Kiểm tra console logs:**
   - Nếu API key hợp lệ, sẽ thấy: `✅ RESEND_API_KEY format looks valid`
   - Nếu không hợp lệ, sẽ thấy thông báo lỗi chi tiết

### Nếu vẫn không nhận được email:

1. **Kiểm tra API key có đúng không:**
   - Vào Resend dashboard → API Keys
   - Đảm bảo key có quyền "Send emails"
   - Kiểm tra key chưa bị revoke hoặc expired

2. **Kiểm tra email address có hợp lệ không:**
   - Đảm bảo email người nhận đúng format
   - Không có khoảng trắng hoặc ký tự đặc biệt

3. **Kiểm tra rate limits:**
   - Resend free tier có giới hạn số email/ngày
   - Kiểm tra trong dashboard xem đã vượt quá limit chưa

4. **Verify domain (cho production):**
   - Vào Resend → Domains
   - Add và verify domain của bạn
   - Cập nhật `from` address trong code

## Các cải thiện đã được thêm vào code:

### 1. Plain Text Version
- Email giờ có cả HTML và plain text version
- Giúp email không bị spam filter chặn

### 2. Reply-To Address
- Thêm reply-to address để người nhận có thể reply
- Cấu hình qua `RESEND_REPLY_TO_EMAIL` trong .env.local

### 3. Email Headers
- Thêm custom headers để tracking tốt hơn
- Thêm tags để phân loại email

### 4. Loại bỏ emoji trong subject
- Emoji trong subject line có thể trigger spam filter
- Đã được loại bỏ để tăng deliverability

### 5. Cải thiện nội dung email
- Thêm disclaimer về automated email
- Cải thiện format và structure

## Cấu hình Environment Variables:

Thêm vào `.env.local`:
```bash
# Required
RESEND_API_KEY=re_your_api_key_here

# Optional - sẽ dùng default nếu không set
RESEND_FROM_EMAIL="DentWise <noreply@yourdomain.com>"
RESEND_REPLY_TO_EMAIL="support@yourdomain.com"
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Lưu ý:** 
- Nếu không set `RESEND_FROM_EMAIL`, sẽ dùng `onboarding@resend.dev` (test domain)
- Để tránh spam, nên verify domain và set `RESEND_FROM_EMAIL` thành domain đã verify

