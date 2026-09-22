import { useState, useMemo } from 'react';
import LessonCard from '../Components/LessonCard';
import { useStudent } from '../context/StudentContext';
import { GRADES, BRANCHES } from '../data/platformData';
import { Search, Filter, BookOpen, GraduationCap, Shield } from 'lucide-react';

export default function LessonsPage() {
  const { student, lessonsList, userRole } = useStudent();
  const isTeacher = userRole === 'teacher';

  const studentGrade = student?.grade || 'الصف الثالث الثانوي';
  const [selectedGrade, setSelectedGrade] = useState(studentGrade);
  const [selectedBranch, setSelectedBranch] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  // If teacher, they can view all grades; if student, locked strictly to student's grade
  const effectiveGrade = isTeacher ? selectedGrade : studentGrade;

  const gradeOptions = ['الكل', ...GRADES.map(g => g.name)];

  const filteredLessons = useMemo(() => {
    return (lessonsList || []).filter((lesson) => {
      const matchGrade = effectiveGrade === 'الكل' || lesson.grade === effectiveGrade;
      const matchBranch = selectedBranch === 'الكل' || lesson.branch === selectedBranch;
      const matchSearch = 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.branch.toLowerCase().includes(searchQuery.toLowerCase());

      return matchGrade && matchBranch && matchSearch;
    });
  }, [lessonsList, effectiveGrade, selectedBranch, searchQuery]);

  // Extract unique branches available for this grade
  const gradeBranches = useMemo(() => {
    const branchesInGrade = new Set(
      (lessonsList || [])
        .filter(l => effectiveGrade === 'الكل' || l.grade === effectiveGrade)
        .map(l => l.branch)
    );
    return ['الكل', ...Array.from(branchesInGrade)];
  }, [lessonsList, effectiveGrade]);

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Header & Search */}
      <div className="section-header">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700, marginBottom: '6px' }}>
            <BookOpen size={14} />
            <span>المكتبة التعليمية ومحاضرات الفيديو</span>
          </div>
          <h1 className="section-title">
            {isTeacher ? 'جميع المحاضرات والدروس' : `المحاضرات والشروحات المقررة لـ (${studentGrade})`}
          </h1>
          <p className="section-desc">
            {isTeacher 
              ? 'تصفح وإدارة كل الدروس والمراحل التعليمية'
              : `محتوى مخصص ومقيد لـ: ${student?.name || 'طالب المنصة'} • ${studentGrade}`
            }
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="ابحث في دروس صفك..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '1rem', paddingRight: '2.5rem', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>
      </div>

      {/* Grade Lock Indicator for Student */}
      {!isTeacher && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-lg, 14px)',
          padding: '12px 18px',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>
                المحتوى المعروض خاص بـ: <span style={{ color: 'var(--cyan)' }}>{studentGrade}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                يتم عرض الشروحات والتمارين والواجبات الخاصة بمرحلتك الدراسية فقط
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--emerald)', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 12px', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
            <Shield size={13} />
            <span>حساب موثق ومفعل</span>
          </div>
        </div>
      )}

      {/* Grade Tabs ONLY FOR TEACHER */}
      {isTeacher && (
        <div className="filter-tabs-row">
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} style={{ color: 'var(--cyan)' }} />
            تصفية الصف (لوضع المعلم):
          </span>
          {gradeOptions.map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`tab-btn ${selectedGrade === grade ? 'active' : ''}`}
            >
              {grade}
            </button>
          ))}
        </div>
      )}

      {/* Branch Tabs for current Grade */}
      <div className="filter-tabs-row" style={{ marginBottom: '1.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '8px' }}>
          الفرع:
        </span>
        {gradeBranches.map((branch) => (
          <button
            key={branch}
            onClick={() => setSelectedBranch(branch)}
            className={`tab-btn ${selectedBranch === branch ? 'active' : ''}`}
            style={{ fontSize: '0.75rem', padding: '4px 14px' }}
          >
            {branch}
          </button>
        ))}
      </div>

      {/* Lessons List */}
      <div>
        {filteredLessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>لا توجد محاضرات منشورة لهذا الفرع حالياً</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>سيقوم أ/ محمد عبد الخالق بإضافة شروحات جديدة قريباً</p>
            <button
              onClick={() => { setSelectedBranch('الكل'); setSearchQuery(''); }}
              className="btn-primary"
              style={{ marginTop: '1rem', fontSize: '0.8rem' }}
            >
              عرض كل دروس صفك
            </button>
          </div>
        ) : (
          filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))
        )}
      </div>

    </div>
  );
}
