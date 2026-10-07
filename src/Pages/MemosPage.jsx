import { useState, useMemo } from "react";
import { useStudent } from "../context/useStudent";
import { GRADES } from "../data/platformData";
import {
  BookOpen,
  Download,
  CheckCircle2,
  Filter,
  GraduationCap,
  Shield,
} from "lucide-react";

export default function MemosPage() {
  const { showToast, memosList, student, userRole } = useStudent();
  const isTeacher = userRole === "teacher";

  const studentGrade = student?.grade || "الصف الثالث الثانوي";
  const [selectedGrade, setSelectedGrade] = useState(studentGrade);

  const effectiveGrade = isTeacher ? selectedGrade : studentGrade;

  const filteredMemos = useMemo(() => {
    return (memosList || []).filter((memo) => {
      if (effectiveGrade === "الكل") return true;
      return memo.grade === effectiveGrade || memo.gradeId === student?.gradeId;
    });
  }, [memosList, effectiveGrade, student]);

  return (
    <div
      className="container"
      style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}
    >
      <div className="section-header">
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              color: "var(--purple)",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            <BookOpen size={14} />
            <span>السلسلة التعليمية الأشهر في الرياضيات</span>
          </div>
          <h1 className="section-title">
            {isTeacher
              ? "سلسلة مذكرات العميد في الرياضيات"
              : `مذكرات وملخصات (${studentGrade})`}
          </h1>
          <p className="section-desc">
            {isTeacher
              ? "إعداد مستر / محمد عبد الخالق - متوفرة للتحميل بصيغة PDF لجميع المراحل"
              : `المذكرات الأصلية ونماذج الامتحانات المخصصة لـ: ${student?.name || "طالب المنصة"}`}
          </p>
        </div>
      </div>

      {/* Grade Lock Banner for Student */}
      {!isTeacher && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.25)",
            borderRadius: "var(--radius-lg, 14px)",
            padding: "12px 18px",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "rgba(168, 85, 247, 0.2)",
                color: "var(--purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: "#ffffff",
                  fontSize: "0.95rem",
                }}
              >
                مذكرات وملخصات:{" "}
                <span style={{ color: "var(--purple)" }}>{studentGrade}</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                تحتوي على شرح تفصيلي، خرائط ذهنية، وبنك أسئلة تابلت حديثة
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              color: "var(--emerald)",
              background: "rgba(16, 185, 129, 0.15)",
              padding: "4px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontWeight: 700,
            }}
          >
            <Shield size={13} />
            <span>تحميل مباشر ومجاني</span>
          </div>
        </div>
      )}

      {/* Grade Filter for Teacher */}
      {isTeacher && (
        <div className="filter-tabs-row" style={{ marginBottom: "1.5rem" }}>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              marginLeft: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Filter size={14} style={{ color: "var(--purple)" }} />
            تصفية الصف (لوضع المعلم):
          </span>
          {["الكل", ...GRADES.map((g) => g.name)].map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`tab-btn ${selectedGrade === grade ? "active" : ""}`}
            >
              {grade}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredMemos.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "4rem 1rem",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p
              style={{ fontWeight: 800, fontSize: "1.1rem", color: "#ffffff" }}
            >
              لا توجد مذكرات مرفوعة لهذا الصف حالياً
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              سيتم رفع المذكرات الخاصة بصفك قريباً
            </p>
          </div>
        ) : (
          filteredMemos.map((memo) => (
            <div
              key={memo.id}
              className="feature-card"
              style={{ padding: "1.25rem" }}
            >
              {/* Book Cover */}
              <div
                style={{
                  position: "relative",
                  aspectRatio: "3/4",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  background: "#090d16",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "1rem",
                }}
              >
                <img
                  src={memo.cover}
                  alt={memo.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.8)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.65rem",
                    color: "var(--cyan)",
                    fontWeight: 700,
                  }}
                >
                  {memo.year}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    left: "8px",
                    background: "rgba(0,0,0,0.85)",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#fff",
                  }}
                >
                  <span>{memo.pages} صفحة</span>
                  <span style={{ color: "var(--purple)", fontWeight: 700 }}>
                    {memo.fileSize}
                  </span>
                </div>
              </div>

              <span
                className="badge-tag"
                style={{ marginBottom: "8px", display: "inline-block" }}
              >
                {memo.grade}
              </span>

              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  marginBottom: "0.75rem",
                  lineHeight: "1.4",
                }}
              >
                {memo.title}
              </h3>

              <ul
                style={{
                  listStyle: "none",
                  marginBottom: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {memo.features?.map((feat, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <CheckCircle2
                      size={13}
                      style={{ color: "var(--emerald)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  showToast(`تم بدء تحميل ملف PDF: ${memo.title} 📥`)
                }
                className="btn-primary"
                style={{ width: "100%", fontSize: "0.8rem", padding: "10px" }}
              >
                <Download size={15} />
                <span>تحميل المذكرة PDF</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
