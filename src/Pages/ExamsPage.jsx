import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { Timer, CheckCircle, AlertCircle, Trophy, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ExamsPage() {
  const { id } = useParams();
  const { student, showToast, lessonsList, userRole } = useStudent();
  const isTeacher = userRole === 'teacher';
  const studentGrade = student?.grade || 'الصف الثالث الثانوي';

  // Find lesson matching ID or default to student's grade first quiz
  const gradeLessons = (lessonsList || []).filter(l => isTeacher || l.grade === studentGrade);
  
  const lesson = id 
    ? (lessonsList || []).find(l => l.id === parseInt(id))
    : (gradeLessons.find(l => l.quiz && l.quiz.questions?.length > 0) || gradeLessons[0]);

  if (!lesson) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <h2>لا توجد اختبارات متاحة لصفك حالياً</h2>
        <Link to="/lessons" className="btn-primary" style={{ marginTop: '1rem' }}>العودة للدروس</Link>
      </div>
    );
  }

  // Access check
  if (!isTeacher && studentGrade && lesson.grade && studentGrade !== lesson.grade) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 1rem', maxWidth: '600px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-xl)', padding: '2.5rem 1.5rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem' }}>
            🔒
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>اختبار غير متاح لصفك</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
            هذا الاختبار خاص بـ <strong style={{ color: 'var(--cyan)' }}>({lesson.grade})</strong>، وأنت مسجل في <strong style={{ color: 'var(--amber)' }}>({studentGrade})</strong>.
          </p>
          <Link to="/lessons" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
            الانتقال لاختبارات صفك
          </Link>
        </div>
      </div>
    );
  }

  return <QuizView key={lesson.id} lesson={lesson} student={student} showToast={showToast} />;
}

function QuizView({ lesson, student, showToast }) {
  const questions = lesson?.quiz?.questions || [];
  const totalQuestions = questions.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((lesson?.quiz?.durationMinutes || 10) * 60);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const handleSelectOption = (optIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIdx]: optIdx
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const score = calculateScore();
    const percentage = Math.round((score / (totalQuestions || 1)) * 100);

    if (percentage >= 50) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.error(e);
      }
      showToast(`أحسنت يا ${student?.name || 'بطل الرياضيات'}! نتيجتك: ${percentage}% 🏆`);
    } else {
      showToast(`درجتك ${percentage}%، راجع الشرح وأعد المحاولة 💪`);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const score = calculateScore();
  const percentage = Math.round((score / (totalQuestions || 1)) * 100);
  const currentQ = questions[currentIdx];

  return (
    <div className="container" style={{ paddingTop: '1.5rem', maxWidth: '850px' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <span className="badge-tag">امتحان إلكتروني بنظام التابلت</span>
          <h1 className="section-title" style={{ fontSize: '1.4rem', marginTop: '6px' }}>
            {lesson?.quiz?.title || 'اختبار الرياضيات'}
          </h1>
          <p className="section-desc">
            طالب: <strong style={{ color: '#fff' }}>{student?.name || 'طالب متميز'}</strong> ({student?.grade || lesson.grade})
          </p>
        </div>

        {!isSubmitted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.9)', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--amber)', fontWeight: 800, fontSize: '0.9rem' }}>
            <Timer size={18} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {isSubmitted ? (
        /* Result Screen */
        <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: percentage >= 50 ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'linear-gradient(135deg, #f43f5e 0%, #ea580c 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)' }}>
            {percentage >= 50 ? <Trophy size={40} /> : <AlertCircle size={40} />}
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {percentage >= 80 ? `ممتاز وتفوق مبهر يا ${student?.name || 'بطل'}! 🌟` :
             percentage >= 50 ? `أحسنت يا ${student?.name || 'بطل'}، نتيجة طيبة! 👍` :
             `فرصة أفضل في المرة القادمة يا ${student?.name || 'بطل'} 💪`}
          </h2>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: '1.5rem' }}>
            حصلت على <strong style={{ color: 'var(--cyan)', fontSize: '1.2rem' }}>{score}</strong> من إجمالي <strong style={{ color: '#ffffff', fontSize: '1.2rem' }}>{totalQuestions}</strong> أسئلة ({percentage}%)
          </p>

          {/* Model Answers Review */}
          <div style={{ textAlign: 'right', background: '#090e1a', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>نموذج الإجابات والتوضيح:</h4>
            {questions.map((q, idx) => {
              const userAns = selectedAnswers[idx];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div key={q.id} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontWeight: 700 }}>
                    <span>{idx + 1}. {q.question}</span>
                    <span style={{ color: isCorrect ? 'var(--emerald)' : 'var(--rose)' }}>{isCorrect ? '✓ صحيح' : '✗ خطأ'}</span>
                  </div>
                  <div style={{ marginTop: '3px' }}>
                    الإجابة النموذجية: <strong style={{ color: 'var(--emerald)' }}>{q.options[q.correctIndex]}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={() => { setSelectedAnswers({}); setIsSubmitted(false); setCurrentIdx(0); setTimeLeft(600); }} className="btn-secondary">
              <RotateCcw size={16} />
              <span>إعادة الاختبار</span>
            </button>
            <Link to="/lessons" className="btn-primary">
              <span>العودة للدروس</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Active Question Screen */
        <div className="form-card" style={{ maxWidth: '100%' }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>السؤال {currentIdx + 1} من {totalQuestions}</span>
              <span>المتبقي: {totalQuestions - Object.keys(selectedAnswers).length} أسئلة</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#090e1a', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)', transition: 'width 0.25s ease' }}></div>
            </div>
          </div>

          {/* Question Prompt */}
          <div style={{ background: '#090e1a', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 700, background: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px' }}>
              مسألة رياضيات #{currentIdx + 1}
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', lineHeight: '1.6' }}>
              {currentQ?.question}
            </h3>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {currentQ?.options?.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIdx] === optIdx;
              const optionLetters = ['أ', 'ب', 'جـ', 'د'];
              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    textAlign: 'right',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: isSelected ? 'var(--cyan)' : '#1e293b', color: isSelected ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                      {optionLetters[optIdx] || optIdx + 1}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{opt}</span>
                  </div>
                  {isSelected && <CheckCircle size={18} style={{ color: 'var(--cyan)' }} />}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
              className="btn-secondary"
              style={{ opacity: currentIdx === 0 ? 0.3 : 1 }}
            >
              <ArrowRight size={16} />
              <span>السابق</span>
            </button>

            {currentIdx < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIdx(p => Math.min(totalQuestions - 1, p + 1))}
                className="btn-primary"
              >
                <span>التالي</span>
                <ArrowLeft size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}
              >
                <CheckCircle size={16} />
                <span>تسليم الامتحان وإنهاء</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
