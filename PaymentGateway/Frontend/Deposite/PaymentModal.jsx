import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Global socket connection
const socket = io(import.meta.env.VITE_API_BASE_URL);

export const PaymentModal = ({ isOpen, onClose, payment }) => {
  const [status, setStatus] = useState(payment?.status || "waiting");
  const [message, setMessage] = useState("");

  // Map payment statuses to user-friendly messages
  const statusMessages = {
    waiting: "Waiting for payment from customer...",
    confirming: "Payment is being processed on the blockchain...",
    confirmed: "Payment confirmed on the blockchain.",
    sending: "Funds are being sent to your wallet...",
    partially_paid: "Partial payment received.",
    finished: "Payment completed successfully!",
    failed: "Payment failed. Please try again.",
    refunded: "Payment has been refunded.",
    expired: "Payment expired. No funds received.",
  };

  useEffect(() => {
    if (!isOpen || !payment?.payment_id) return;

    // Join the room for this payment
    socket.emit("joinRoom", payment.payment_id);

    const handlePaymentUpdate = (data) => {
      console.log(data);

      if (data.payment_id === payment.payment_id) {
        setStatus(data.status);
        setMessage(statusMessages[data.status] || "Updating...");

        if (data.status === "finished") {
          setTimeout(() => onClose(), 2000); // auto-close after 2s
        }
      }
    };

    socket.on("paymentUpdate", handlePaymentUpdate);

    // Cleanup listener when modal unmounts
    return () => {
      socket.off("paymentUpdate", handlePaymentUpdate);
    };
  }, [isOpen, payment]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-2xl p-8 w-[90%] max-w-lg shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-300 hover:text-white"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold mb-4 text-center">
            💳 Payment Details
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-semibold">
                {payment.price_amount} {payment.price_currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pay in Crypto:</span>
              <span className="font-semibold">
                {payment.pay_amount} {payment.pay_currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Wallet Address:</span>
              <span
                className="font-mono text-xs bg-black/30 px-2 py-1 rounded cursor-pointer hover:bg-black/50 transition"
                onClick={() => {
                  navigator.clipboard.writeText(payment.pay_address);
                  setMessage("Wallet address copied!");
                  setTimeout(
                    () => setMessage(statusMessages[status] || ""),
                    2000
                  ); // reset after 2s
                }}
                title="Click to copy full address"
              >
                {payment.pay_address.slice(0, 12)}...
              </span>
            </div>

            <div className="flex justify-between">
              <span>Expires At:</span>
              <span>
                {new Date(payment.expiration_estimate_date).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment ID:</span>
              <span className="font-mono text-xs">{payment.payment_id}</span>
            </div>
            <div className="mt-2 text-center font-semibold">{message}</div>
          </div>

          <div className="flex flex-col items-center mt-6 space-y-2">
            <QRCodeCanvas
              value={payment.pay_address}
              size={180}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
              includeMargin={true}
            />
            <p className="text-xs text-gray-400">Scan to Pay</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
