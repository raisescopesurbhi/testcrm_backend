# 💳 NOWPayments Integration with Node.js + Express

This document explains how our backend integrates with **NOWPayments** to handle deposits, payment tracking, and automatic crediting of MT5 accounts.

---

## 📌 Flow Overview

1. **Frontend** → Sends deposit request (`amount`, `userId`, `mt5Account`, `accountType`).  
2. **Backend `createPaymentController`** → Creates payment request with NOWPayments API.  
3. **NOWPayments** → Returns a unique `payment_id`, payment address, and QR code.  
4. **User** → Sends crypto to the given address.  
5. **NOWPayments IPN (Callback)** → Calls our backend `/payment-callback` with payment status updates.  
6. **Backend `nowPaymentsCallbackController`** → Updates DB, emits real-time updates via Socket.IO, and auto-credits MT5 account when payment is `finished`.

---

## ⚙️ API Endpoints

### 1. `POST /api/auth/create-payment`

Creates a new payment request with NOWPayments.

#### Request Body
```json
{
  "userId": "123456",
  "mt5Account": "MT50001",
  "accountType": "real",
  "amount": 100
}
