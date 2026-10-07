import { Link } from "react-router-dom";
import { PlayCircle, Award, FileText } from "lucide-react";
import { useStudent } from "../context/useStudent";

export default function LessonCard({ lesson }) {
  const { showToast } = useStudent();

  return (
    <div className="lesson-card">
      <div className="lesson-info-group">
        {/* Number Badge (Matches 01, 02 in Figma) */}
        <div className="lesson-num-badge">{lesson.number}</div>

        <div>
          <h3 className="lesson-title">{lesson.title}</h3>
          <div className="lesson-meta">
            <span
              style={{
                color: "#a5b4fc",
                background: "rgba(99, 102, 241, 0.15)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(99, 102, 241, 0.25)",
              }}
            >
              {lesson.branch}
            </span>
            <span
              style={{
                color: "var(--cyan)",
                background: "rgba(6, 182, 212, 0.12)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(6, 182, 212, 0.2)",
              }}
            >
              {lesson.grade}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link
          to={`/watch/${lesson.id}`}
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: "0.8rem" }}
        >
          <PlayCircle size={15} />
          <span>مشاهدة الشرح</span>
        </Link>
        <Link
          to={`/quiz/${lesson.id}`}
          className="btn-secondary"
          style={{
            padding: "8px 14px",
            fontSize: "0.8rem",
            color: "var(--amber)",
          }}
        >
          <Award size={15} />
          <span>امتحان الدرس</span>
        </Link>
        <button
          onClick={() =>
            showToast(
              `جاري تجهيز وتحميل مذكرة الدرس PDF: ${lesson.pdfFile || lesson.title} 📥`,
            )
          }
          className="btn-secondary"
          style={{ padding: "8px 12px" }}
          title="تحميل مذكرة الدرس PDF"
        >
          <FileText size={15} />
        </button>
      </div>
    </div>
  );
}
