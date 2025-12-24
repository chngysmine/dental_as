# UC SPECIFICATIONS - DENTAL APPOINTMENT SYSTEM

## 1. UC Specification for Login/Register

| UC Name | Login/Register |
|---------|----------------|
| **Actor:** | User, Admin, Clerk Authentication |
| **Description:** | Use case này mô tả quy trình người dùng đăng nhập vào hệ thống web hoặc tạo tài khoản mới thông qua dịch vụ Clerk |
| **Pre-condition:** | 1. Ứng dụng web đã deploy và có thể truy cập qua trình duyệt<br>2. Hệ thống đã cấu hình Clerk (API keys, redirect URLs)<br>3. Người dùng có kết nối Internet |

### Basic Flow:
1. User truy cập trang web
2. Hệ thống hiển thị trang Landing với nút Sign in / Sign up
3. User chọn phương thức đăng nhập (Email/Password or Google)
4. User nhập thông tin đăng nhập hoặc đăng ký
5. Clerk xác thực thông tin đăng nhập/đăng ký
6. Nếu user là admin (email trùng ADMIN_EMAIL), hệ thống điều hướng tới Admin Dashboard
7. Nếu user là user thường, hệ thống điều hướng tới User Dashboard
8. Component UserSync chạy ở background để đồng bộ thông tin user vào database

### Alternative Flow:
**Alternative Flow 1: New account registration**
- Condition: Tại bước 3, nếu user không có tài khoản
- Steps:
  1. User chọn "Sign up"
  2. User nhập email, password
  3. Clerk tạo tài khoản mới và (nếu cấu hình) gửi email xác minh
  4. Sau khi xác minh, hệ thống đăng nhập user và chuyển đến Dashboard tương ứng

**Alternative Flow 2: Login failure**
- Condition: Tại bước 5, nếu thông tin đăng nhập không đúng
- Steps:
  1. Hệ thống hiển thị error message
  2. User có thể thử lại hoặc reset password

**Alternative Flow 3: Clerk API lỗi**
- Condition: Tại bước 5, nếu Clerk API fail
- Steps:
  1. Hệ thống log lỗi nhưng không crash
  2. Hiển thị landing page nếu chưa đăng nhập
  3. User có thể thử lại

### Postconditions:
1. User được xác thực trong hệ thống
2. Thông tin user được lưu đồng bộ trong bảng User
3. User đang ở trang Dashboard phù hợp với vai trò (Admin hoặc User)

### Special Requirements:
1. Mọi thông tin đăng nhập được xử lý và lưu trữ an toàn bởi Clerk
2. Support for Google Sign-In
3. Session được Clerk quản lý, hỗ trợ tự động đăng nhập lại
4. Graceful error handling - không crash app khi Clerk lỗi
5. Tự động sync user từ Clerk vào database

---

## 2. UC Specification for Manage 

| UC Name | Manage Doctors |
|---------|----------------|
| **Actor:** | Admin |
| **Description:** | Use case này mô tả việc thêm, chỉnh sửa, xóa và xem thông tin bác sĩ trong hệ thống. |
| **Pre-condition:** | 1. User đã đăng nhập<br>2. User có quyền Admin (email khớp với ADMIN_EMAIL)<br>3. Kết nối đến PostgreSQL database |

### Basic Flow:
1. Admin truy cập trang Admin Dashboard
2. Hệ thống hiển thị danh sách bác sĩ hiện tại
3. Admin chọn hành động (Add hoặc Edit)
4. Hệ thống hiển thị form tương ứng
5. Admin nhập/chỉnh sửa thông tin bác sĩ (name, email, phone, speciality, bio, gender, isActive)
6. Hệ thống validate dữ liệu (email unique, required fields)
7. Hệ thống lưu thông tin vào database
8. Hệ thống cập nhật danh sách bác sĩ

### Alternative Flow:
**Alternative Flow 1: Delete doctor**
- Condition: Tại bước 3, nếu admin chọn delete
- Steps:
  1. Hệ thống hiển thị cảnh báo xác nhận
  2. Nếu admin xác nhận, hệ thống kiểm tra appointments liên quan
  3. Nếu có appointments, hệ thống cảnh báo (cascade delete)
  4. Hệ thống xóa bác sĩ khỏi database

**Alternative Flow 2: Email đã tồn tại**
- Condition: Tại bước 6, nếu email đã được sử dụng bởi bác sĩ khác
- Steps:
  1. Hệ thống hiển thị error message "Email already exists"
  2. Admin phải nhập email khác
  3. Quay lại bước 5

**Alternative Flow 3: Database connection lỗi**
- Condition: Tại bước 7, nếu database không kết nối được
- Steps:
  1. Hệ thống log lỗi
  2. Hiển thị error message cho admin
  3. Admin có thể thử lại

### Postconditions:
1. Thông tin bác sĩ được lưu/cập nhật trong database
2. Danh sách bác sĩ được cập nhật real-time
3. Dữ liệu được đồng bộ với database

### Special Requirements:
1. Validation dữ liệu đầu vào (email format, required fields)
2. Email phải unique trong hệ thống
3. Tự động generate avatar từ name và gender
4. Real-time update danh sách sau khi thay đổi
5. Cascade delete appointments khi xóa bác sĩ

---

## 3. UC Specification for Book Appointment

| UC Name | Book Appointment |
|---------|------------------|
| **Actor:** | Patient (User) |
| **Description:** | Use case này mô tả quy trình đặt lịch hẹn với bác sĩ nha khoa qua 3 bước: chọn bác sĩ → chọn thời gian → xác nhận. |
| **Pre-condition:** | 1. User đã đăng nhập (Clerk authentication)<br>2. User đã được sync vào database<br>3. Kết nối đến PostgreSQL database<br>4. Có ít nhất một bác sĩ active trong hệ thống |

### Basic Flow:
1. User truy cập trang Appointments
2. Hệ thống hiển thị danh sách bác sĩ available
3. User chọn bác sĩ (Step 1)
4. Hệ thống hiển thị form chọn ngày, giờ và loại appointment (Step 2)
5. User chọn ngày, giờ và loại appointment
6. Hệ thống kiểm tra time slot có available không
7. User xem lại thông tin và xác nhận (Step 3)
8. Hệ thống tạo appointment với status CONFIRMED
9. Hệ thống gửi email xác nhận (nếu có RESEND_API_KEY)
10. Hệ thống hiển thị modal xác nhận thành công

### Alternative Flow:
**Alternative Flow 1: Time slot đã được book**
- Condition: Tại bước 6, nếu time slot đã được book
- Steps:
  1. Hệ thống hiển thị thông báo "Time slot không available"
  2. User chọn time slot khác
  3. Quay lại bước 6

**Alternative Flow 2: Email gửi thất bại**
- Condition: Tại bước 9, nếu gửi email thất bại
- Steps:
  1. Hệ thống log lỗi nhưng không hiển thị cho user
  2. Appointment vẫn được tạo thành công
  3. Tiếp tục bước 10

**Alternative Flow 3: User chưa được sync**
- Condition: Tại bước 2, nếu user chưa có trong database
- Steps:
  1. Hệ thống tự động sync user từ Clerk
  2. Tạo user mới trong database nếu chưa tồn tại
  3. Tiếp tục bước 2

**Alternative Flow 4: User quay lại bước trước**
- Condition: Tại bất kỳ bước nào, user có thể quay lại
- Steps:
  1. User click nút "Back"
  2. Hệ thống quay lại bước trước
  3. Dữ liệu đã chọn được giữ lại

### Postconditions:
1. Appointment được tạo với status CONFIRMED
2. Appointment được liên kết với user và doctor
3. Email xác nhận được gửi (nếu có cấu hình)
4. Danh sách appointments của user được cập nhật
5. Time slot được đánh dấu là booked

### Special Requirements:
1. Validation: doctorId, date, time là required
2. Kiểm tra time slot conflict trước khi tạo
3. Default duration: 30 phút
4. Default status: CONFIRMED
5. Email notification là optional (không block nếu fail)
6. 3-step booking process với progress indicator
7. Hiển thị existing appointments của user

---

## 4. UC Specification for Manage Appointments

| UC Name | Manage Appointments |
|---------|---------------------|
| **Actor:** | Patient (User), Admin |
| **Description:** | Use case này mô tả việc xem, cập nhật status và quản lý appointments. |
| **Pre-condition:** | 1. User đã đăng nhập<br>2. Kết nối đến PostgreSQL database |

### Basic Flow:
1. User/Admin truy cập trang Dashboard hoặc Appointments
2. Hệ thống hiển thị danh sách appointments (của user hoặc tất cả nếu admin)
3. User/Admin xem thông tin appointment (doctor, date, time, status, reason)
4. User/Admin có thể cập nhật status (PENDING, CONFIRMED, CANCELLED, COMPLETED)
5. Hệ thống validate status mới
6. Hệ thống cập nhật appointment trong database
7. Hệ thống refresh danh sách appointments

### Alternative Flow:
**Alternative Flow 1: User xem appointments của mình**
- Condition: Tại bước 2, nếu là regular user
- Steps:
  1. Hệ thống chỉ hiển thị appointments của user đó
  2. Sắp xếp theo date và time tăng dần
  3. Hiển thị thông tin doctor đầy đủ

**Alternative Flow 2: Admin xem tất cả appointments**
- Condition: Tại bước 2, nếu là admin
- Steps:
  1. Hệ thống hiển thị tất cả appointments
  2. Sắp xếp theo createdAt giảm dần
  3. Hiển thị thông tin cả patient và doctor

**Alternative Flow 3: Cancel appointment**
- Condition: Tại bước 4, nếu user chọn cancelled
- Steps:
  1. Hệ thống cập nhật status thành CANCELLED
  2. Time slot trở lại available
  3. Có thể gửi email thông báo hủy (optional)

**Alternative Flow 4: Invalid status transition**
- Condition: Tại bước 5, nếu status transition không hợp lệ
- Steps:
  1. Hệ thống hiển thị error message
  2. Không cập nhật status
  3. User có thể chọn status khác

### Postconditions:
1. Status appointment được cập nhật
2. Danh sách appointments được refresh
3. Dữ liệu được đồng bộ với database

### Special Requirements:
1. User chỉ có thể xem appointments của mình (trừ admin)
2. Status chỉ có thể là: PENDING, CONFIRMED, CANCELLED, COMPLETED
3. Real-time update sau khi thay đổi
4. Hiển thị thông tin đầy đủ: doctor name, image, date, time, reason
5. Color coding cho các status khác nhau

---

## 5. UC Specification for User Authentication & Sync

| UC Name | User Authentication & Sync |
|---------|----------------------------|
| **Actor:** | User |
| **Description:** | Use case này mô tả quy trình đăng nhập, đăng ký và đồng bộ thông tin user từ Clerk vào database. |
| **Pre-condition:** | 1. Clerk authentication service hoạt động<br>2. Kết nối đến PostgreSQL database |

### Basic Flow:
1. User truy cập trang web
2. Nếu chưa đăng nhập, hệ thống redirect đến trang sign-in
3. User đăng nhập/đăng ký qua Clerk
4. Clerk xác thực và trả về user info
5. Hệ thống kiểm tra user có trong database chưa
6. Nếu chưa có, hệ thống tạo user mới từ Clerk data
7. Nếu đã có, hệ thống sử dụng user hiện tại
8. Hệ thống redirect user đến dashboard

### Alternative Flow:
**Alternative Flow 1: Clerk API lỗi**
- Condition: Tại bước 4, nếu Clerk API fail
- Steps:
  1. Hệ thống log lỗi nhưng không crash
  2. Hiển thị landing page nếu chưa đăng nhập
  3. User có thể thử lại

**Alternative Flow 2: Database connection lỗi**
- Condition: Tại bước 5-6, nếu database không kết nối được
- Steps:
  1. Hệ thống log lỗi
  2. Return null thay vì throw error
  3. User vẫn có thể sử dụng một số tính năng cơ bản

**Alternative Flow 3: User không có email**
- Condition: Tại bước 6, nếu Clerk user không có email
- Steps:
  1. Hệ thống throw error "User email is required"
  2. Không tạo user trong database
  3. User cần cập nhật email trong Clerk

**Alternative Flow 4: UserSync component chạy background**
- Condition: Sau khi user đăng nhập thành công
- Steps:
  1. Component UserSync tự động chạy
  2. Kiểm tra và sync thông tin user từ Clerk
  3. Cập nhật database nếu có thay đổi

### Postconditions:
1. User được xác thực qua Clerk
2. User được sync vào database (nếu chưa có)
3. User có thể truy cập các tính năng của hệ thống
4. User được redirect đến đúng dashboard (user hoặc admin)

### Special Requirements:
1. ClerkID phải unique trong database
2. Email phải unique trong database
3. Tự động sync firstName, lastName, email, phone từ Clerk
4. Graceful error handling - không crash app khi Clerk/DB lỗi
5. Admin check: nếu email khớp ADMIN_EMAIL thì redirect đến admin dashboard
6. Background sync không block UI

---

## 6. UC Specification for View Dashboard

| UC Name | View Dashboard |
|---------|----------------|
| **Actor:** | User, Admin |
| **Description:** | Use case này mô tả việc xem dashboard với thống kê và thông tin tổng quan. |
| **Pre-condition:** | 1. User đã đăng nhập<br>2. Kết nối đến PostgreSQL database |

### Basic Flow:
1. User truy cập trang Dashboard
2. Hệ thống kiểm tra quyền (admin hoặc regular user)
3. Nếu là admin, hiển thị Admin Dashboard
4. Nếu là user, hiển thị User Dashboard
5. Hệ thống load dữ liệu thống kê (stats, appointments, doctors)
6. Hệ thống hiển thị thông tin tổng quan

### Alternative Flow:
**Alternative Flow 1: Admin Dashboard**
- Condition: Tại bước 3, nếu user là admin
- Steps:
  1. Hiển thị AdminStats (total doctors, active doctors, total appointments, completed)
  2. Hiển thị RecentAppointments (tất cả appointments)
  3. Hiển thị DoctorsManagement section
  4. Hiển thị welcome message với admin badge

**Alternative Flow 2: User Dashboard**
- Condition: Tại bước 4, nếu user là regular user
- Steps:
  1. Hiển thị WelcomeSection với tên user
  2. Hiển thị MainActions (quick links)
  3. Hiển thị ActivityOverview (appointments stats)
  4. Hiển thị NextAppointment (appointment sắp tới)
  5. Hiển thị DentalHealthOverview (nếu có)

**Alternative Flow 3: Loading state**
- Condition: Tại bước 5, khi đang load data
- Steps:
  1. Hiển thị loading spinner
  2. Hiển thị "Loading dashboard..." message
  3. Chờ data load xong

**Alternative Flow 4: Error state**
- Condition: Tại bước 5, nếu có lỗi load data
- Steps:
  1. Hiển thị error message
  2. Hiển thị "Please try refreshing the page"
  3. User có thể retry

**Alternative Flow 5: No appointments**
- Condition: Tại bước 6, nếu user chưa có appointments
- Steps:
  1. Hiển thị NoNextAppointments component
  2. Hiển thị CTA để book appointment đầu tiên

### Postconditions:
1. Dashboard được hiển thị với đầy đủ thông tin
2. Thống kê được cập nhật real-time
3. User có thể thực hiện các action từ dashboard

### Special Requirements:
1. Phân quyền rõ ràng giữa admin và user
2. Real-time data synchronization
3. Graceful error handling
4. Responsive design cho mobile và desktop
5. Loading states cho better UX
6. Empty states với CTA

---

## 7. UC Specification for Voice Appointment Booking

| UC Name | Voice Appointment Booking |
|---------|---------------------------|
| **Actor:** | Patient (User) |
| **Description:** | Use case này mô tả việc đặt lịch hẹn thông qua AI voice assistant (Vapi). |
| **Pre-condition:** | 1. User đã đăng nhập<br>2. Vapi API được cấu hình (NEXT_PUBLIC_VAPI_API_KEY)<br>3. Kết nối đến PostgreSQL database<br>4. User có Pro plan (optional check) |

### Basic Flow:
1. User truy cập trang Voice
2. Hệ thống kiểm tra user có Pro plan không (optional)
3. Nếu có, hiển thị VapiWidget
4. User click để bắt đầu voice conversation
5. AI assistant hỏi thông tin (doctor preference, date, time)
6. User trả lời qua voice
7. AI assistant xử lý và tạo appointment
8. Hệ thống xác nhận appointment qua voice
9. Hệ thống hiển thị thông tin appointment đã tạo

### Alternative Flow:
**Alternative Flow 1: Vapi API lỗi**
- Condition: Tại bước 5-7, nếu Vapi API fail
- Steps:
  1. Hiển thị error message
  2. User có thể thử lại hoặc dùng web form

**Alternative Flow 2: Thông tin không đầy đủ**
- Condition: Tại bước 7, nếu thiếu thông tin
- Steps:
  1. AI assistant hỏi lại thông tin thiếu
  2. User cung cấp thông tin
  3. Quay lại bước 7

**Alternative Flow 3: User không có Pro plan**
- Condition: Tại bước 2, nếu user không có Pro plan
- Steps:
  1. Hiển thị ProPlanRequired component
  2. Hiển thị CTA để upgrade
  3. User có thể dùng web form thay thế

**Alternative Flow 4: Vapi API key chưa cấu hình**
- Condition: Tại bước 3, nếu NEXT_PUBLIC_VAPI_API_KEY không có
- Steps:
  1. Sử dụng stub client
  2. Hiển thị warning message
  3. Feature không hoạt động

### Postconditions:
1. Appointment được tạo thành công (nếu đủ thông tin)
2. User nhận xác nhận qua voice
3. Appointment được lưu vào database
4. User có thể xem appointment trong dashboard

### Special Requirements:
1. Pro plan check (có thể optional)
2. Natural language processing qua Vapi
3. Voice-to-text và text-to-voice conversion
4. Integration với appointment booking system
5. Fallback to web form nếu voice fail
6. Graceful degradation khi API key không có

---

## 8. UC Specification for Contact/Chat Support

| UC Name | Contact/Chat Support |
|---------|---------------------|
| **Actor:** | Patient (User), Admin |
| **Description:** | Use case này mô tả hệ thống chat giữa user và admin để hỗ trợ khách hàng. User có thể gửi tin nhắn qua chatbot button, admin có thể xem và trả lời trong admin panel. |
| **Pre-condition:** | 1. User đã đăng nhập<br>2. Kết nối đến PostgreSQL database |

### Basic Flow:
1. User click vào ChatbotButton (floating button ở góc dưới bên phải)
2. Hệ thống tạo hoặc lấy contact của user
3. Hệ thống mở ChatDialog
4. User nhập tin nhắn và gửi
5. Hệ thống lưu tin nhắn vào database
6. Admin xem danh sách contacts trong trang Admin/Contact
7. Admin chọn contact để xem tin nhắn
8. Admin trả lời tin nhắn
9. Hệ thống lưu tin nhắn của admin
10. User nhận tin nhắn real-time qua SSE

### Alternative Flow:
**Alternative Flow 1: User gửi tin nhắn đầu tiên**
- Condition: Tại bước 2, nếu user chưa có contact
- Steps:
  1. Hệ thống tự động tạo contact mới
  2. Liên kết contact với user
  3. Tiếp tục bước 3

**Alternative Flow 2: Real-time message update**
- Condition: Sau khi tin nhắn được gửi
- Steps:
  1. Hệ thống sử dụng SSE (Server-Sent Events) để push tin nhắn mới
  2. Client tự động cập nhật danh sách tin nhắn
  3. Scroll to bottom để hiển thị tin nhắn mới

**Alternative Flow 3: Admin xem danh sách contacts**
- Condition: Admin truy cập trang Contact
- Steps:
  1. Hệ thống hiển thị danh sách contacts với latest message
  2. Sắp xếp theo updatedAt giảm dần
  3. Hiển thị số lượng tin nhắn và thời gian tin nhắn cuối

**Alternative Flow 4: Database connection lỗi**
- Condition: Tại bước 5 hoặc 9, nếu database lỗi
- Steps:
  1. Hệ thống log lỗi
  2. Hiển thị error message
  3. User/Admin có thể thử lại

**Alternative Flow 5: Empty message**
- Condition: Tại bước 4, nếu user gửi tin nhắn rỗng
- Steps:
  1. Hệ thống không cho phép gửi
  2. Hiển thị validation error
  3. User phải nhập nội dung

### Postconditions:
1. Tin nhắn được lưu vào database
2. Contact được cập nhật updatedAt
3. Tin nhắn hiển thị real-time cho cả user và admin
4. Danh sách contacts được cập nhật

### Special Requirements:
1. Real-time messaging qua SSE (Server-Sent Events)
2. Phân biệt tin nhắn của admin và user (isAdmin flag)
3. Auto-scroll to latest message
4. Responsive design cho mobile và desktop
5. Graceful error handling
6. Contact được tạo tự động khi user gửi tin nhắn đầu tiên
7. Admin chỉ xem được contacts của tất cả users
8. User chỉ xem được contact của chính mình

---

## 9. UC Specification for Send Email Notifications

| UC Name | Send Email Notifications |
|---------|--------------------------|
| **Actor:** | System |
| **Description:** | Use case này mô tả việc gửi email xác nhận appointment cho user sau khi đặt lịch thành công. |
| **Pre-condition:** | 1. Appointment đã được tạo thành công<br>2. RESEND_API_KEY được cấu hình (optional)<br>3. User có email hợp lệ |

### Basic Flow:
1. User đặt appointment thành công
2. Hệ thống gọi API /api/send-appointment-email
3. Hệ thống kiểm tra RESEND_API_KEY có tồn tại không
4. Nếu có, hệ thống render email template (React Email)
5. Hệ thống gửi email qua Resend API
6. Hệ thống log kết quả (success hoặc error)
7. User nhận email xác nhận

### Alternative Flow:
**Alternative Flow 1: RESEND_API_KEY không có**
- Condition: Tại bước 3, nếu API key không được cấu hình
- Steps:
  1. Hệ thống log warning
  2. Không gửi email
  3. Appointment vẫn được tạo thành công
  4. Không hiển thị error cho user

**Alternative Flow 2: Email gửi thất bại**
- Condition: Tại bước 5, nếu Resend API trả về error
- Steps:
  1. Hệ thống log error chi tiết
  2. Appointment vẫn được tạo thành công
  3. Không hiển thị error cho user (email là optional)
  4. Log error với instructions để fix

**Alternative Flow 3: Email validation error**
- Condition: Tại bước 5, nếu email format không hợp lệ
- Steps:
  1. Hệ thống trả về 400 Bad Request
  2. Log error message
  3. Không gửi email

**Alternative Flow 4: Resend API trong test mode**
- Condition: Tại bước 5, nếu API key ở test mode
- Steps:
  1. Resend chỉ cho phép gửi đến verified email
  2. Nếu gửi đến email khác, trả về 403 error
  3. Hệ thống log instructions để verify domain
  4. Appointment vẫn được tạo thành công

**Alternative Flow 5: Email template render error**
- Condition: Tại bước 4, nếu render email template fail
- Steps:
  1. Hệ thống log error
  2. Trả về 500 error
  3. Không gửi email
  4. Appointment vẫn được tạo thành công

### Postconditions:
1. Email được gửi thành công (nếu có cấu hình)
2. Email ID được log để tracking
3. Appointment vẫn được tạo dù email fail (email là optional)

### Special Requirements:
1. Email notification là optional - không block appointment creation
2. Sử dụng React Email để render template
3. Support cả HTML và plain text version
4. Graceful error handling - không crash khi email fail
5. Detailed logging cho debugging
6. Support test mode và production mode của Resend
7. Email template bao gồm: doctor name, date, time, type, duration, price
8. Instructions rõ ràng khi có lỗi (verify domain, check API key)

---

## 10. UC Specification for View Landing Page

| UC Name | View Landing Page |
|---------|-------------------|
| **Actor:** | Visitor (chưa đăng nhập) |
| **Description:** | Use case này mô tả việc xem trang landing page với thông tin về dịch vụ, pricing, và cách sử dụng. |
| **Pre-condition:** | 1. Ứng dụng web đã deploy<br>2. User chưa đăng nhập hoặc đã logout |

### Basic Flow:
1. Visitor truy cập trang chủ (/)
2. Hệ thống kiểm tra user đã đăng nhập chưa
3. Nếu chưa đăng nhập, hiển thị Landing Page
4. Visitor xem các sections: Headers, Hero, HowItWorks, WhatToAsk, PricingSection, CTA, Footer
5. Visitor có thể click Sign in / Sign up để đăng nhập
6. Nếu đã đăng nhập, hệ thống redirect đến Dashboard

### Alternative Flow:
**Alternative Flow 1: User đã đăng nhập**
- Condition: Tại bước 2, nếu user đã đăng nhập
- Steps:
  1. Hệ thống tự động redirect đến /dashboard
  2. Không hiển thị landing page

**Alternative Flow 2: Clerk API lỗi**
- Condition: Tại bước 2, nếu Clerk API fail
- Steps:
  1. Hệ thống log lỗi
  2. Vẫn hiển thị landing page (assume chưa đăng nhập)
  3. User có thể thử đăng nhập lại

**Alternative Flow 3: Visitor click CTA button**
- Condition: Tại bước 5, visitor click "Get started" hoặc "Sign up"
- Steps:
  1. Mở Clerk sign-up modal
  2. Visitor đăng ký tài khoản
  3. Sau khi đăng ký, redirect đến Dashboard

### Postconditions:
1. Visitor xem được thông tin đầy đủ về dịch vụ
2. Visitor có thể đăng ký/đăng nhập từ landing page
3. Nếu đã đăng nhập, visitor được redirect đến dashboard

### Special Requirements:
1. Responsive design cho mọi thiết bị
2. Smooth scrolling và animations
3. Clear CTA buttons để encourage sign-up
4. Hiển thị pricing plans (Free, AI Basic, AI Pro)
5. Giải thích cách hoạt động (How It Works)
6. Graceful handling khi Clerk API lỗi
7. SEO-friendly structure

---

## 11. UC Specification for View Pro/Pricing Page

| UC Name | View Pro/Pricing Page |
|---------|----------------------|
| **Actor:** | User (đã đăng nhập) |
| **Description:** | Use case này mô tả việc xem trang Pro/Pricing để upgrade plan và xem các tính năng premium. |
| **Pre-condition:** | 1. User đã đăng nhập<br>2. User có thể truy cập trang /pro |

### Basic Flow:
1. User truy cập trang Pro (/pro)
2. Hệ thống kiểm tra user đã đăng nhập chưa
3. Nếu chưa đăng nhập, redirect đến trang chủ
4. Hệ thống hiển thị Pro page với thông tin về plans
5. User xem các plans: Free, AI Basic ($9/month), AI Pro ($19/month)
6. User có thể click để upgrade plan (hiện tại chưa implement payment)

### Alternative Flow:
**Alternative Flow 1: User chưa đăng nhập**
- Condition: Tại bước 2, nếu user chưa đăng nhập
- Steps:
  1. Hệ thống redirect đến trang chủ (/)
  2. User cần đăng nhập trước

**Alternative Flow 2: Clerk API lỗi**
- Condition: Tại bước 2, nếu Clerk API fail
- Steps:
  1. Hệ thống log lỗi
  2. Redirect đến trang chủ để an toàn

**Alternative Flow 3: User click upgrade button**
- Condition: Tại bước 6, user click upgrade
- Steps:
  1. Hiện tại chưa implement payment gateway
  2. Button có thể redirect đến external payment page (future)
  3. Hoặc hiển thị "Coming soon" message

### Postconditions:
1. User xem được thông tin về các plans
2. User hiểu được sự khác biệt giữa các plans
3. User có thể quyết định upgrade (nếu muốn)

### Special Requirements:
1. Chỉ accessible cho user đã đăng nhập
2. Hiển thị rõ ràng features của từng plan
3. Highlight "Most Popular" plan
4. Responsive design
5. Future: Integration với payment gateway
6. Future: Check user's current plan và highlight

---

## TÓM TẮT Ý CHÍNH

### Các Entity chính:
1. **User** - Người dùng (patient) với thông tin từ Clerk
2. **Doctor** - Bác sĩ nha khoa với thông tin chi tiết
3. **Appointment** - Lịch hẹn giữa user và doctor
4. **Contact** - Contact thread giữa user và admin
5. **Message** - Tin nhắn trong contact thread

### Các Use Case chính:
1. **Login/Register** - Đăng nhập/đăng ký qua Clerk
2. **Manage Doctors** - Admin quản lý bác sĩ (CRUD)
3. **Book Appointment** - User đặt lịch hẹn (3 bước: chọn bác sĩ → chọn thời gian → xác nhận)
4. **Manage Appointments** - Xem và cập nhật appointments
5. **User Authentication & Sync** - Đăng nhập và đồng bộ user từ Clerk
6. **View Dashboard** - Xem dashboard với stats (khác nhau cho admin và user)
7. **Voice Appointment Booking** - Đặt lịch qua AI voice assistant (Vapi)
8. **Contact/Chat Support** - Chat giữa user và admin với real-time messaging
9. **Send Email Notifications** - Gửi email xác nhận appointment (optional)
10. **View Landing Page** - Xem trang landing với thông tin dịch vụ
11. **View Pro/Pricing Page** - Xem trang pricing và upgrade plan

### Công nghệ sử dụng:
- **Authentication**: Clerk
- **Database**: PostgreSQL với Prisma ORM
- **Email**: Resend API (React Email templates)
- **Voice AI**: Vapi
- **Framework**: Next.js 15 với React 19
- **UI**: Radix UI + Tailwind CSS
- **Real-time**: Server-Sent Events (SSE) cho chat
- **State Management**: TanStack Query (React Query)

### Đặc điểm nổi bật:
- Phân quyền rõ ràng (Admin vs User)
- Real-time data synchronization (appointments, messages)
- Real-time messaging qua SSE
- Graceful error handling (không crash khi DB/Clerk/Email lỗi)
- Email notifications (optional, không block flow)
- Voice AI integration cho Pro users
- Responsive design
- 3-step booking process với progress indicator
- Background user sync
- Comprehensive logging cho debugging
