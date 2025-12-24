# ✅ Kết quả kiểm tra Email

## 📊 Tình trạng hiện tại

✅ File `.env.local` đã tồn tại  
✅ `RESEND_API_KEY` đã có trong file  

## 🔍 Các bước kiểm tra tiếp theo

### 1. Kiểm tra API Key Format

API key phải:
- Bắt đầu bằng `re_`
- Không có khoảng trắng hoặc dấu ngoặc kép
- Độ dài tối thiểu 20 ký tự

**Cách kiểm tra:**
1. Mở file `.env.local`
2. Tìm dòng `RESEND_API_KEY=`
3. Đảm bảo format đúng:
   ```
   ✅ ĐÚNG: RESEND_API_KEY=re_1234567890abcdefghij
   ❌ SAI:  RESEND_API_KEY="re_123..."  (có dấu ngoặc kép)
   ❌ SAI:  RESEND_API_KEY= re_123...   (có khoảng trắng)
   ```

### 2. Restart Server (QUAN TRỌNG!)

Sau khi thêm/sửa `.env.local`, **PHẢI** restart server:

```bash
# 1. Dừng server hiện tại (nhấn Ctrl+C trong terminal)
# 2. Chạy lại:
npm run dev
```

### 3. Test Email Configuration

Tôi đã tạo endpoint test để kiểm tra:

**Cách 1: Mở trình duyệt**
```
http://localhost:3000/api/test-email
```

**Cách 2: Dùng curl (PowerShell)**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-email" | Select-Object -ExpandProperty Content
```

**Kết quả mong đợi:**
- `hasApiKey: true` → API key đã được load
- `apiKeyFormat: "valid"` → Format đúng
- `testEmailSent: true` → Email đã được gửi thành công

### 4. Kiểm tra Console Logs

Khi book appointment, kiểm tra:

**A. Browser Console (F12 → Console):**
- Tìm log: `Email API response status: 200`
- Hoặc: `✅ Email sent successfully`

**B. Terminal (nơi chạy npm run dev):**
- Tìm log: `✅ RESEND_API_KEY is configured`
- Tìm log: `✅ Email sent successfully!`
- Nếu có lỗi: `❌` sẽ hiển thị chi tiết

### 5. Kiểm tra Resend Dashboard

1. Đăng nhập: https://resend.com/emails
2. Vào tab "Logs" hoặc "Emails"
3. Xem danh sách email đã gửi
4. Kiểm tra:
   - Status: `sent`, `delivered`, `bounced`, `failed`
   - Nếu có error, xem chi tiết

### 6. Kiểm tra Email Inbox

Email có thể:
- ✅ Vào **Inbox** (thành công)
- ⚠️ Vào **Spam/Junk folder** (thường xảy ra với `onboarding@resend.dev`)
- ⚠️ Vào **Promotions tab** (nếu dùng Gmail)

**Lưu ý:** Email từ domain test `onboarding@resend.dev` thường bị Gmail chặn hoặc đưa vào spam.

## 🐛 Các vấn đề thường gặp

### Vấn đề 1: Email không được gửi

**Triệu chứng:**
- Console không có log `✅ Email sent successfully`
- Resend dashboard không có email mới

**Nguyên nhân có thể:**
1. API key sai format
2. Server chưa restart sau khi thêm API key
3. API key đã bị revoke hoặc expired

**Cách khắc phục:**
1. Kiểm tra API key format
2. Restart server
3. Lấy API key mới từ Resend dashboard

### Vấn đề 2: Email được gửi nhưng không nhận được

**Triệu chứng:**
- Console có log `✅ Email sent successfully`
- Resend dashboard có email với status `sent`
- Nhưng không thấy email trong inbox

**Nguyên nhân:**
- Email bị chặn bởi spam filter
- Domain `resend.dev` chưa được verify
- Email vào spam folder

**Cách khắc phục:**
1. ✅ Kiểm tra **Spam folder** trước tiên
2. ✅ Verify domain trong Resend (xem `RESEND_SETUP.md`)
3. ✅ Cập nhật `RESEND_FROM_EMAIL` trong `.env.local`

### Vấn đề 3: Lỗi "Resend instance is null"

**Triệu chứng:**
- Console có log `❌ Resend instance is null`
- Test endpoint trả về `resendInstance: false`

**Nguyên nhân:**
- API key format sai
- Resend client không được khởi tạo

**Cách khắc phục:**
1. Kiểm tra API key format (phải bắt đầu bằng `re_`)
2. Xóa và tạo lại file `.env.local`
3. Restart server

## 📝 Checklist nhanh

Trước khi test lại, đảm bảo:

- [ ] File `.env.local` có `RESEND_API_KEY=re_...` (không có dấu ngoặc kép)
- [ ] API key bắt đầu bằng `re_`
- [ ] Server đã được **restart** sau khi thêm/sửa API key
- [ ] Test endpoint `/api/test-email` trả về `hasApiKey: true`
- [ ] Đã kiểm tra **Spam folder** trong email
- [ ] Đã kiểm tra **Resend dashboard** để xem email có được gửi không

## 🚀 Test ngay bây giờ

1. **Restart server:**
   ```bash
   # Dừng server (Ctrl+C)
   npm run dev
   ```

2. **Test endpoint:**
   - Mở: http://localhost:3000/api/test-email
   - Xem kết quả

3. **Book một appointment:**
   - Vào trang appointments
   - Book một appointment
   - Mở Browser Console (F12)
   - Xem logs

4. **Kiểm tra Resend dashboard:**
   - Vào https://resend.com/emails
   - Xem có email mới không

## 💡 Tips

- **Development:** Có thể dùng `onboarding@resend.dev` nhưng email dễ bị spam
- **Production:** Nên verify domain và dùng custom email address
- **Debug:** Luôn kiểm tra cả Browser Console và Terminal logs
- **Email delivery:** Nếu email vào spam, verify domain sẽ giúp cải thiện

## 📞 Nếu vẫn không được

1. Chạy test endpoint và copy kết quả
2. Kiểm tra Resend dashboard và copy error messages
3. Xem cả Browser Console và Terminal logs
4. Gửi các thông tin trên để được hỗ trợ thêm

