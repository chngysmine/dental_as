# 🔧 Hướng dẫn Debug Lỗi 500 Internal Server Error

## ❌ Lỗi hiện tại

Bạn đang gặp lỗi **500 Internal Server Error** khi gọi API `/api/send-appointment-email`.

## 🔍 Các bước debug

### Bước 1: Xem Terminal Logs (QUAN TRỌNG NHẤT!)

Lỗi 500 có nghĩa là server đã gặp lỗi. **Terminal logs sẽ cho biết lỗi cụ thể.**

1. **Mở terminal nơi chạy `npm run dev`**
2. **Book một appointment** (hoặc refresh trang)
3. **Tìm các log bắt đầu bằng:**
   - `📧 Email API called at:` - API đã được gọi
   - `❌` - Có lỗi xảy ra
   - `✅` - Thành công

4. **Copy toàn bộ error message** từ terminal

### Bước 2: Xem Browser Console

1. Mở **Developer Tools** (F12)
2. Vào tab **Console**
3. Tìm log: `Email API response data:`
4. Xem chi tiết error object

### Bước 3: Test API trực tiếp

Tôi đã tạo script PowerShell để test:

```powershell
# Chạy trong PowerShell (từ thư mục project)
.\test-email-api.ps1
```

Hoặc dùng curl:
```bash
curl -X POST http://localhost:3000/api/send-appointment-email \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "doctorName": "Dr. Test",
    "appointmentDate": "Monday, January 1, 2024",
    "appointmentTime": "10:00 AM",
    "appointmentType": "General Consultation",
    "duration": "30 min",
    "price": "$50"
  }'
```

### Bước 4: Kiểm tra các nguyên nhân thường gặp

#### ❌ Nguyên nhân 1: RESEND_API_KEY không được load

**Triệu chứng:**
- Terminal log: `❌ RESEND_API_KEY is not configured`
- Response: `"Email service is not configured"`

**Cách khắc phục:**
1. Kiểm tra file `.env.local` có `RESEND_API_KEY` không
2. **Restart server** (Ctrl+C rồi `npm run dev`)

#### ❌ Nguyên nhân 2: Resend instance is null

**Triệu chứng:**
- Terminal log: `❌ Resend instance is null`
- Response: `"Resend instance could not be created"`

**Cách khắc phục:**
1. Kiểm tra API key format (phải bắt đầu bằng `re_`)
2. Xem terminal khi start server - có log `✅ RESEND_API_KEY format looks valid` không?

#### ❌ Nguyên nhân 3: Lỗi render email component

**Triệu chứng:**
- Terminal log: `❌ Failed to render email HTML`
- Response: `"Failed to render email template"`

**Cách khắc phục:**
1. Kiểm tra `@react-email/render` đã được cài đặt:
   ```bash
   npm list @react-email/render
   ```
2. Nếu chưa có, cài đặt:
   ```bash
   npm install @react-email/render
   ```

#### ❌ Nguyên nhân 4: Lỗi Resend API

**Triệu chứng:**
- Terminal log: `Resend error:`
- Response có `details` object với error từ Resend

**Cách khắc phục:**
1. Kiểm tra API key có hợp lệ không (vào Resend dashboard)
2. Kiểm tra rate limits (Resend có giới hạn email/ngày)
3. Xem error details trong response để biết lỗi cụ thể

#### ❌ Nguyên nhân 5: Missing dependencies

**Triệu chứng:**
- Terminal log: `Cannot find module '@react-email/render'`
- Hoặc: `Cannot find module 'resend'`

**Cách khắc phục:**
```bash
npm install
```

## 📋 Checklist Debug

- [ ] Đã xem **Terminal logs** (nơi chạy npm run dev)
- [ ] Đã xem **Browser Console** (F12)
- [ ] Đã test API trực tiếp bằng script hoặc curl
- [ ] Đã kiểm tra `.env.local` có `RESEND_API_KEY`
- [ ] Đã **restart server** sau khi sửa `.env.local`
- [ ] Đã kiểm tra API key format (bắt đầu bằng `re_`)
- [ ] Đã kiểm tra dependencies (`npm install`)

## 🚀 Quick Fix

1. **Restart server:**
   ```bash
   # Dừng server (Ctrl+C)
   npm run dev
   ```

2. **Kiểm tra terminal logs khi start:**
   - Phải thấy: `✅ RESEND_API_KEY format looks valid`
   - Nếu không thấy → API key chưa được load

3. **Test lại:**
   - Book appointment
   - Xem terminal logs
   - Copy error message

## 📞 Cần hỗ trợ?

Gửi các thông tin sau:

1. **Terminal logs** (từ khi start server đến khi gặp lỗi)
2. **Browser Console logs** (F12 → Console)
3. **Response từ test script** (nếu đã chạy)
4. **Nội dung file `.env.local`** (chỉ hiển thị tên biến, không hiển thị giá trị)

## 💡 Lưu ý

- **Lỗi 500 = Server Error** → Phải xem terminal logs
- **Lỗi 400 = Bad Request** → Kiểm tra request body
- **Lỗi 200 = Success** → Email đã được gửi (có thể vào spam)

