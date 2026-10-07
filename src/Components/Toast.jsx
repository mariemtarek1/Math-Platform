import { useStudent } from "../context/useStudent";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function Toast() {
  const { toast } = useStudent();
  if (!toast) return null;

  const message = typeof toast === "string" ? toast : toast.message || "";
  const isDanger =
    message.includes("رفض") ||
    message.includes("إلغاء") ||
    message.includes("تعطيل") ||
    message.includes("حذف") ||
    message.includes("خطأ") ||
    message.includes("فشل");

  return (
    <div
      className="toast-box"
      style={{
        borderColor: isDanger ? "rgba(244, 63, 94, 0.6)" : "var(--cyan)",
        background: isDanger
          ? "linear-gradient(135deg, #2d0612 0%, #0f172a 100%)"
          : "linear-gradient(135deg, #091e3a 0%, #081226 100%)",
        boxShadow: isDanger
          ? "0 10px 30px rgba(225, 29, 72, 0.25), 0 0 1px 1px rgba(244, 63, 94, 0.4)"
          : "0 10px 30px rgba(6, 182, 212, 0.2), 0 0 1px 1px rgba(6, 182, 212, 0.3)",
      }}
    >
      {isDanger ? (
        <AlertCircle
          size={20}
          style={{ color: "var(--rose)", flexShrink: 0 }}
        />
      ) : (
        <CheckCircle2
          size={20}
          style={{ color: "var(--cyan)", flexShrink: 0 }}
        />
      )}
      <span style={{ lineHeight: "1.4" }}>{message}</span>
    </div>
  );
}
