import { useState, useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { GRADES, BRANCHES } from '../data/platformData';
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  Search, 
  Eye, 
  X, 
  XCircle,
  ShieldCheck,
  Video,
  FileQuestion,
  BookOpen,
  Users,
  Plus,
  Clock,
  Key,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  Phone,
  PowerOff,
  BarChart2
} from 'lucide-react';
import { getGradeNameById } from '../services/api';

export default function TeacherDashboardPage() {
  const { 
    studentsList, 
    lessonsList,
    memosList,
    pendingRequests,
    approvedSubscriptions,
    isLoadingRequests,
    isLoadingApproved,
    fetchPendingRequests,
    fetchApprovedStudents,
    approveActivationRequest,
    rejectActivationRequest,
    deactivateStudentSubscription,
    createStudentByAdmin,
    updateStudentByAdmin,
    addLesson,
    deleteLesson,
    addQuestionToLessonQuiz,
    deleteQuestionFromQuiz,
    addMemo,
    deleteMemo,
    selectActiveStudent,
    student: activeStudent,
    showToast
  } = useStudent();

  // Active Main Tab: 'requests' | 'approved' | 'students' | 'lessons' | 'quizzes' | 'memos'
  const [activeTab, setActiveTab] = useState('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('الكل');
  const [copiedCode, setCopiedCode] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // --- Modals State ---
  // 1. Add Lesson Modal
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [newLessonData, setNewLessonData] = useState({
    title: '',
    branch: BRANCHES[1] || 'التفاضل والتكامل',
    grade: GRADES[0].name,
    gradeId: GRADES[0].id,
    duration: '45 دقيقة',
    videoUrl: 'https://youtu.be/qJ-Op0x0yCM?si=HrcEYlkOUWW4X5m9',
    pdfFile: 'مذكرة_الشرح.pdf',
    description: '',
  });

  // 2. Add Quiz Question Modal
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState(lessonsList[0]?.id || 1);
  const [newQuestionData, setNewQuestionData] = useState({
    question: '',
    opt1: '',
    opt2: '',
    opt3: '',
    opt4: '',
    correctIndex: 0,
    explanation: '',
  });

  // 3. Add Memo Modal
  const [isAddMemoOpen, setIsAddMemoOpen] = useState(false);
  const [newMemoData, setNewMemoData] = useState({
    title: '',
    grade: GRADES[0].name,
    pages: 120,
    fileSize: '15.0 MB',
  });

  // 4. Student Modals (API Schema Aligned)
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    parent_phone: '',
    grade_id: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    code_expires_at: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  });

  // --- Handlers ---
  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`تم نسخ كود الاشتراك [ ${code} ] إلى الحافظة 📋`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApproveRequest = async (id) => {
    setIsProcessingAction(true);
    await approveActivationRequest(id);
    setIsProcessingAction(false);
  };

  const handleRejectRequest = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من رفض طلب تفعيل الطالب «${name}»؟`)) {
      setIsProcessingAction(true);
      await rejectActivationRequest(id);
      setIsProcessingAction(false);
    }
  };

  const handleDeactivate = async (subscriptionId, studentName) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في تعطيل اشتراك الطالب ${studentName || ''}؟ لن يتمكن من تسجيل الدخول بعدها.`)) {
      setIsProcessingAction(true);
      await deactivateStudentSubscription(subscriptionId);
      setIsProcessingAction(false);
    }
  };

  const handleSaveLesson = (e) => {
    e.preventDefault();
    if (!newLessonData.title.trim()) return;
    addLesson(newLessonData);
    setIsAddLessonOpen(false);
    setNewLessonData({
      title: '',
      branch: BRANCHES[1] || 'التفاضل والتكامل',
      grade: GRADES[0].name,
      gradeId: GRADES[0].id,
      duration: '45 دقيقة',
      videoUrl: 'https://youtu.be/qJ-Op0x0yCM?si=HrcEYlkOUWW4X5m9',
      pdfFile: 'مذكرة_الشرح.pdf',
      description: '',
    });
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionData.question.trim() || !newQuestionData.opt1.trim() || !newQuestionData.opt2.trim()) return;
    const qObj = {
      question: newQuestionData.question,
      options: [newQuestionData.opt1, newQuestionData.opt2, newQuestionData.opt3 || 'جـ', newQuestionData.opt4 || 'د'],
      correctIndex: parseInt(newQuestionData.correctIndex),
      explanation: newQuestionData.explanation,
    };
    addQuestionToLessonQuiz(parseInt(selectedLessonForQuiz), qObj);
    setIsAddQuestionOpen(false);
    setNewQuestionData({
      question: '',
      opt1: '',
      opt2: '',
      opt3: '',
      opt4: '',
      correctIndex: 0,
      explanation: '',
    });
  };

  const handleSaveMemo = (e) => {
    e.preventDefault();
    if (!newMemoData.title.trim()) return;
    addMemo(newMemoData);
    setIsAddMemoOpen(false);
    setNewMemoData({
      title: '',
      grade: GRADES[0].name,
      pages: 120,
      fileSize: '15.0 MB',
    });
  };

  const handleSaveNewStudent = async (e) => {
    e.preventDefault();
    if (!newStudentData.first_name.trim() || !newStudentData.last_name.trim()) return;
    setIsProcessingAction(true);
    await createStudentByAdmin(newStudentData);
    setIsProcessingAction(false);
    setIsAddStudentOpen(false);
    setNewStudentData({
      first_name: '',
      last_name: '',
      phone: '',
      parent_phone: '',
      grade_id: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      code_expires_at: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    });
  };

  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsProcessingAction(true);
    const nameParts = (editingStudent.name || `${editingStudent.first_name || ''} ${editingStudent.last_name || ''}`).trim().split(' ');
    await updateStudentByAdmin(editingStudent.id, {
      first_name: editingStudent.first_name || nameParts[0] || 'طالب',
      last_name: editingStudent.last_name || nameParts.slice(1).join(' ') || 'جديد',
      phone: editingStudent.phone || '',
      parent_phone: editingStudent.parent_phone || editingStudent.parentPhone || '',
      grade_id: Number(editingStudent.grade_id || editingStudent.gradeId || 1)
    });
    setIsProcessingAction(false);
    setEditingStudent(null);
  };

  // Filtered lists for Students Roster
  const filteredStudents = useMemo(() => {
    return studentsList.filter((std) => {
      const matchesGrade = gradeFilter === 'الكل' || std.grade === gradeFilter;
      const matchesSearch = !searchQuery || 
        std.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.phone?.includes(searchQuery) ||
        std.parentPhone?.includes(searchQuery) ||
        std.code?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGrade && matchesSearch;
    });
  }, [studentsList, gradeFilter, searchQuery]);

  // Filtered Approved Subscriptions
  const filteredApproved = useMemo(() => {
    return approvedSubscriptions.filter((sub) => {
      const studentName = `${sub.student?.first_name || ''} ${sub.student?.last_name || ''}`.trim();
      const matchesSearch = !searchQuery ||
        studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.subscription_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.student?.phone?.includes(searchQuery);
      return matchesSearch;
    });
  }, [approvedSubscriptions, searchQuery]);

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Top Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700, marginBottom: '6px' }}>
            <ShieldCheck size={16} />
            <span>لوحة الإدارة والتحكم الشاملة بالمنصة • API v1</span>
          </div>
          <h1 className="section-title">
            لوحة تحكم مستر / محمد عبد الخالق 👨‍🏫
          </h1>
          <p className="section-desc">
            إدارة طلبات التفعيل، أكواد الاشتراكات، المحاضرات، بنك الأسئلة، ومذكرات العميد PDF
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { fetchPendingRequests(); fetchApprovedStudents(); showToast('تم تحديث البيانات من السيرفر بنجاح 🔄'); }}
            className="btn-secondary" 
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            title="مزامنة وتحديث البيانات من الباك إند"
          >
            <RefreshCw size={14} />
            <span>تحديث البيانات</span>
          </button>

          {activeTab === 'lessons' && (
            <button onClick={() => setIsAddLessonOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>إضافة محاضرة جديدة</span>
            </button>
          )}
          {activeTab === 'quizzes' && (
            <button onClick={() => setIsAddQuestionOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>إضافة سؤال للامتحانات</span>
            </button>
          )}
          {activeTab === 'memos' && (
            <button onClick={() => setIsAddMemoOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>رفع مذكرة PDF</span>
            </button>
          )}
          {(activeTab === 'students' || activeTab === 'approved') && (
            <button onClick={() => setIsAddStudentOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <UserPlus size={16} />
              <span>إنشاء كود طالب يدوياً</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        
        {/* TAB 1: PENDING ACTIVATION REQUESTS (Backend API) */}
        <button
          onClick={() => setActiveTab('requests')}
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.85rem', position: 'relative' }}
        >
          <Clock size={16} style={{ color: 'var(--amber)' }} />
          <span>طلبات التفعيل المعلقة</span>
          {pendingRequests.length > 0 && (
            <span style={{ background: '#f59e0b', color: '#000', fontWeight: 900, borderRadius: '20px', padding: '1px 8px', fontSize: '0.72rem' }}>
              {pendingRequests.length}
            </span>
          )}
        </button>

        {/* TAB 2: APPROVED SUBSCRIPTIONS & CODES (Backend API) */}
        <button
          onClick={() => setActiveTab('approved')}
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <Key size={16} style={{ color: 'var(--cyan)' }} />
          <span>الاشتراكات المعتمدة والأكواد ({approvedSubscriptions.length})</span>
        </button>

        {/* TAB 3: ALL STUDENTS ROSTER */}
        <button
          onClick={() => setActiveTab('students')}
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <Users size={16} />
          <span>سجل الطلاب ({studentsList.length})</span>
        </button>

        {/* TAB 4: LESSONS */}
        <button
          onClick={() => setActiveTab('lessons')}
          className={`tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <Video size={16} />
          <span>المحاضرات ({lessonsList.length})</span>
        </button>

        {/* TAB 5: QUIZZES */}
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <FileQuestion size={16} />
          <span>بنك الأسئلة</span>
        </button>

        {/* TAB 6: MEMOS */}
        <button
          onClick={() => setActiveTab('memos')}
          className={`tab-btn ${activeTab === 'memos' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <BookOpen size={16} />
          <span>مذكرات PDF ({memosList.length})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PENDING ACTIVATION REQUESTS (GET /api/v1/admin/activation-requests) */}
      {/* ==================================================================== */}
      {activeTab === 'requests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>طلبات الطلاب الجديدة بانتظار الموافقة والتفعيل</span>
                <span className="badge-tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                  {pendingRequests.length} طلب معلق
                </span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                بمجرد النقر على "قبول وتفعيل الكود"، سيتم اعتماد الطالب وتوليد كود اشتراك رسمي له للولوج للمنصة
              </p>
            </div>
          </div>

          {isLoadingRequests ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              جاري تحميل طلبات التفعيل من السيرفر...
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="form-card" style={{ maxWidth: '100%', textAlign: 'center', padding: '3.5rem 1rem', background: '#090e1a' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                لا توجد طلبات تفعيل معلقة حالياً
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                جميع طلبات اشتراك الطلاب تم البت فيها والموافقة عليها بنجاح.
              </p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#090e1a', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '14px 16px' }}>اسم الطالب</th>
                    <th style={{ padding: '14px 16px' }}>الصف الدراسي</th>
                    <th style={{ padding: '14px 16px' }}>هاتف الطالب</th>
                    <th style={{ padding: '14px 16px' }}>هاتف ولي الأمر</th>
                    <th style={{ padding: '14px 16px' }}>تاريخ التقديم</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>قرار المعلم</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req) => {
                    const studentFullName = `${req.first_name || ''} ${req.last_name || ''}`.trim() || req.name || 'طالب جديد';
                    const gradeTitle = req.grade_name || getGradeNameById(req.grade_id);
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                              {studentFullName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#fff' }}>{studentFullName}</div>
                              <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>طلب قيد المراجعة</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className="badge-tag">{gradeTitle}</span>
                        </td>
                        <td style={{ padding: '14px 16px', direction: 'ltr', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {req.phone}
                        </td>
                        <td style={{ padding: '14px 16px', direction: 'ltr', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {req.parent_phone || req.parentPhone}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {req.created_at ? new Date(req.created_at).toLocaleDateString('ar-EG') : 'اليوم'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApproveRequest(req.id)}
                              disabled={isProcessingAction}
                              className="btn-primary"
                              style={{ padding: '7px 12px', fontSize: '0.78rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)' }}
                            >
                              <Check size={14} />
                              <span>قبول</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id, studentFullName)}
                              disabled={isProcessingAction}
                              className="btn-secondary"
                              style={{ padding: '7px 12px', fontSize: '0.78rem', color: '#fda4af', borderColor: 'rgba(244,63,94,0.4)' }}
                            >
                              <XCircle size={14} />
                              <span>رفض</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: APPROVED STUDENTS & CODES (GET /api/v1/admin/approved-students) */}
      {/* ==================================================================== */}
      {activeTab === 'approved' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                قائمة الطلاب المعتمدين وأكواد الاشتراك الفعالة
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                يمكنك نسخ كود الاشتراك للطالب أو تعطيل الاشتراك عند الحاجة لمنعه من تسجيل الدخول
              </p>
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder="بحث بالاسم أو الكود أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '1rem', paddingRight: '2.5rem', fontSize: '0.85rem' }}
              />
              <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          {isLoadingApproved ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              جاري تحميل الاشتراكات المعتمدة...
            </div>
          ) : filteredApproved.length === 0 ? (
            <div className="form-card" style={{ maxWidth: '100%', textAlign: 'center', padding: '3.5rem 1rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>لا توجد اشتراكات مطابقة لبحثك</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#090e1a', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '14px 16px' }}>اسم الطالب</th>
                    <th style={{ padding: '14px 16px' }}>الصف</th>
                    <th style={{ padding: '14px 16px' }}>كود الاشتراك (Subscription Code)</th>
                    <th style={{ padding: '14px 16px' }}>حالة الاشتراك</th>
                    <th style={{ padding: '14px 16px' }}>تاريخ الانتهاء</th>
                    <th style={{ padding: '14px 16px' }}>الهاتف</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApproved.map((item) => {
                    const studentName = `${item.student?.first_name || ''} ${item.student?.last_name || ''}`.trim() || item.name || 'طالب';
                    const gradeName = getGradeNameById(item.student?.grade_id || item.grade_id);
                    const isActive = item.status === 'active';
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{studentName}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className="badge-tag">{gradeName}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#050914', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '4px 10px', borderRadius: '8px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 900, color: 'var(--cyan)', fontSize: '0.9rem', letterSpacing: '1px' }}>
                              {item.subscription_code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(item.subscription_code)}
                              style={{ background: 'none', border: 'none', color: copiedCode === item.subscription_code ? 'var(--emerald)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              title="نسخ الكود"
                            >
                              {copiedCode === item.subscription_code ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: 800, 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: isActive ? 'var(--emerald)' : '#fda4af',
                            border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                          }}>
                            {isActive ? 'نشط ومعتمد' : 'معطل / ملغي'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {item.code_expires_at || item.end_date || '2027-09-18'}
                        </td>
                        <td style={{ padding: '14px 16px', direction: 'ltr', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {item.student?.phone || 'غير مسجل'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isActive ? (
                            <button
                              onClick={() => handleDeactivate(item.id, studentName)}
                              disabled={isProcessingAction}
                              className="btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--rose)' }}
                              title="تعطيل الاشتراك ومنعه من الدخول"
                            >
                              <PowerOff size={13} />
                              <span>تعطيل الاشتراك</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>تم التعطيل</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: ALL STUDENTS ROSTER (GET /api/v1/admin/students)               */}
      {/* ==================================================================== */}
      {activeTab === 'students' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>الصف:</span>
              {['الكل', ...GRADES.map(g => g.name)].map((g) => (
                <button
                  key={g}
                  onClick={() => setGradeFilter(g)}
                  className={`tab-btn ${gradeFilter === g ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                >
                  {g}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                placeholder="بحث باسم الطالب أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '1rem', paddingRight: '2.5rem', fontSize: '0.85rem' }}
              />
              <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#090e1a', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>اسم الطالب</th>
                  <th style={{ padding: '12px 16px' }}>الصف الدراسي</th>
                  <th style={{ padding: '12px 16px' }}>هاتف الطالب</th>
                  <th style={{ padding: '12px 16px' }}>هاتف ولي الأمر</th>
                  <th style={{ padding: '12px 16px' }}>كود الدخول</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      لا يوجد طلاب يطابقون خيارات البحث
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => {
                    const isActive = activeStudent?.id === std.id;
                    return (
                      <tr key={std.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isActive ? 'rgba(6, 182, 212, 0.08)' : 'transparent' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                              {std.name?.trim().charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#ffffff' }}>{std.name}</div>
                              {isActive && <span style={{ fontSize: '0.65rem', color: 'var(--cyan)', fontWeight: 700 }}>● الطالب النشط بالتوب بار</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}><span className="badge-tag">{std.grade}</span></td>
                        <td style={{ padding: '12px 16px', direction: 'ltr', textAlign: 'right', color: 'var(--text-muted)' }}>{std.phone || 'غير مسجل'}</td>
                        <td style={{ padding: '12px 16px', direction: 'ltr', textAlign: 'right', color: 'var(--text-muted)' }}>{std.parentPhone || std.parent_phone || 'غير مسجل'}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--cyan)', fontWeight: 800 }}>{std.code || 'قيد الاعتماد'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* Activate & view buttons only — no navigation */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewingStudent(std); }} 
                              className="btn-secondary" 
                              style={{ padding: '5px 10px', fontSize: '0.75rem' }} 
                              title="عرض التفاصيل"
                            >
                              <Eye size={14} style={{ color: 'var(--cyan)' }} />
                              <span>تفاصيل</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingStudent(std); }} 
                              className="btn-secondary" 
                              style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--amber)' }} 
                              title="تعديل"
                            >
                              <Edit3 size={14} />
                              <span>تعديل</span>
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                selectActiveStudent(std);
                                showToast(`تم تفعيل حساب ${std.name} في التوب بار`);
                              }} 
                              className="btn-secondary" 
                              style={{ padding: '5px 10px', fontSize: '0.75rem', color: isActive ? 'var(--cyan)' : 'var(--text-muted)', borderColor: isActive ? 'var(--cyan)' : undefined }} 
                              title="تفعيل الطالب في التوب بار"
                            >
                              {isActive ? <Check size={14} /> : <ShieldCheck size={14} />}
                              <span>{isActive ? 'مفعّل' : 'تفعيل'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: LESSONS & VIDEOS MANAGEMENT                                   */}
      {/* ==================================================================== */}
      {activeTab === 'lessons' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>محاضرات وشروحات الفيديو المنشورة:</h3>
            <button onClick={() => setIsAddLessonOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>إضافة / رفع فيديو جديد</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {lessonsList.map((lesson) => (
              <div key={lesson.id} className="feature-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span className="badge-tag">{lesson.grade}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700 }}>{lesson.branch}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                    {lesson.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
                    {lesson.description || 'شرح متكامل وتمارين بنك الأسئلة'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱ {lesson.duration || '45 دقيقة'}</span>
                  <button 
                    onClick={() => { if (window.confirm(`هل أنت متأكد من حذف درس: ${lesson.title}؟`)) deleteLesson(lesson.id); }} 
                    className="btn-secondary" 
                    style={{ color: 'var(--rose)', padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    <Trash2 size={13} />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: QUIZZES MANAGEMENT                                            */}
      {/* ==================================================================== */}
      {activeTab === 'quizzes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>بنك الأسئلة والامتحانات التفاعلية:</h3>
            <button onClick={() => setIsAddQuestionOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>إضافة سؤال إلى بنك الامتحانات</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {lessonsList.filter(l => l.quiz && l.quiz.questions?.length > 0).map((l) => (
              <div key={l.id} className="feature-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{l.quiz.title || `اختبار: ${l.title}`}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>{l.grade} • {l.branch}</span>
                  </div>
                  <span className="badge-tag">{l.quiz.questions.length} سؤال</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {l.quiz.questions.map((q, idx) => (
                    <div key={q.id || idx} style={{ background: '#050914', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fff' }}>
                        <strong>{idx + 1}.</strong> {q.question}
                      </span>
                      <button 
                        onClick={() => deleteQuestionFromQuiz(l.id, q.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', padding: '4px' }}
                        title="حذف السؤال"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: MEMOS MANAGEMENT                                             */}
      {/* ==================================================================== */}
      {activeTab === 'memos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>مذكرات وملخصات العميد PDF:</h3>
            <button onClick={() => setIsAddMemoOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>رفع مذكرة جديدة</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {memosList.map((memo) => (
              <div key={memo.id} className="feature-card" style={{ padding: '1.25rem' }}>
                <div>
                  <span className="badge-tag" style={{ marginBottom: '6px', display: 'inline-block' }}>{memo.grade}</span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>{memo.title}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    <span>{memo.pages} صفحة</span>
                    <span>• {memo.fileSize}</span>
                    <span>• {memo.year}</span>
                  </div>
                </div>

                <button 
                  onClick={() => { if (window.confirm(`هل تريد حذف مذكرة "${memo.title}"؟`)) deleteMemo(memo.id); }} 
                  className="btn-secondary" 
                  style={{ color: 'var(--rose)', width: '100%', fontSize: '0.8rem', padding: '6px' }}
                >
                  <Trash2 size={14} />
                  <span>حذف المذكرة</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD STUDENT MANUALLY BY ADMIN (POST /api/v1/admin/students)   */}
      {/* ==================================================================== */}
      {isAddStudentOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '580px', position: 'relative' }}>
            <button onClick={() => setIsAddStudentOpen(false)} style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', textAlign: 'center', marginBottom: '0.5rem' }}>
              👥 إنشاء حساب طالب وتفعيل كود اشتراك فوراً
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.25rem' }}>
              لا يتطلب موافقة؛ يقوم السيرفر بتوليد كود اشتراك معتمد فوراً وتحديد تواريخ الصلاحية
            </p>

            <form onSubmit={handleSaveNewStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>الاسم الأول *</label>
                  <input type="text" required value={newStudentData.first_name} onChange={(e) => setNewStudentData({ ...newStudentData, first_name: e.target.value })} placeholder="مثال: أحمد" className="form-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>اسم العائلة (اللقب) *</label>
                  <input type="text" required value={newStudentData.last_name} onChange={(e) => setNewStudentData({ ...newStudentData, last_name: e.target.value })} placeholder="مثال: محمود علي" className="form-input" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>الصف الدراسي (grade_id) *</label>
                <select value={newStudentData.grade_id} onChange={(e) => setNewStudentData({ ...newStudentData, grade_id: Number(e.target.value) })} className="form-input" style={{ background: '#0b1120', color: '#fff' }}>
                  {GRADES.map((g) => <option key={g.id} value={g.numericId}>{g.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>هاتف الطالب *</label>
                  <input type="tel" required dir="ltr" value={newStudentData.phone} onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })} placeholder="010XXXXXXXX" className="form-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>هاتف ولي الأمر *</label>
                  <input type="tel" required dir="ltr" value={newStudentData.parent_phone} onChange={(e) => setNewStudentData({ ...newStudentData, parent_phone: e.target.value })} placeholder="011XXXXXXXX" className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>تاريخ بداية الاشتراك</label>
                  <input type="date" value={newStudentData.start_date} onChange={(e) => setNewStudentData({ ...newStudentData, start_date: e.target.value })} className="form-input" style={{ background: '#0b1120', color: '#fff' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>تاريخ انتهاء الكود والاشتراك</label>
                  <input type="date" value={newStudentData.end_date} onChange={(e) => setNewStudentData({ ...newStudentData, end_date: e.target.value, code_expires_at: e.target.value })} className="form-input" style={{ background: '#0b1120', color: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" disabled={isProcessingAction} className="btn-primary" style={{ flex: 1 }}>
                  <span>إنشاء وتفعيل الحساب وتوليد الكود</span>
                </button>
                <button type="button" onClick={() => setIsAddStudentOpen(false)} className="btn-secondary">
                  <span>إلغاء</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VIEW STUDENT DETAILS (GET /api/v1/admin/students/{id})         */}
      {/* ==================================================================== */}
      {viewingStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '600px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setViewingStudent(null)} style={{ position: 'absolute', top: '16px', left: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>

            {/* Student Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900, margin: '0 auto 12px' }}>
                {viewingStudent.name?.charAt(0) || 'ط'}
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{viewingStudent.name}</h2>
              <span className="badge-tag" style={{ marginTop: '4px' }}>{viewingStudent.grade}</span>
            </div>

            {/* Basic Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#050914', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>كود الاشتراك:</span>
                <strong style={{ color: 'var(--cyan)', fontFamily: 'monospace', letterSpacing: '1px' }}>{viewingStudent.code || viewingStudent.subscription_code || 'قيد الاعتماد'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>هاتف الطالب:</span>
                <strong style={{ color: '#fff', direction: 'ltr' }}>{viewingStudent.phone || 'غير مسجل'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>هاتف ولي الأمر:</span>
                <strong style={{ color: '#fff', direction: 'ltr' }}>{viewingStudent.parentPhone || viewingStudent.parent_phone || 'غير مسجل'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>حالة الحساب:</span>
                <span style={{ color: viewingStudent.status === 'pending' ? '#f59e0b' : 'var(--emerald)', fontWeight: 800 }}>
                  {viewingStudent.status === 'pending' ? 'قيد المراجعة' : 'مفعّل ومعتمد'}
                </span>
              </div>
            </div>

            {/* Activity Stats */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--cyan)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart2 size={16} /> إحصائيات النشاط والتقدم
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
              {[
                { icon: <Video size={20} />, label: 'فيديوهات شاهدها', value: viewingStudent.completedLessons ?? Math.floor(Math.random() * lessonsList.length + 1), total: lessonsList.length, color: '#06b6d4' },
                { icon: <FileQuestion size={20} />, label: 'امتحانات أداها', value: viewingStudent.completedQuizzes ?? Math.floor(Math.random() * 5 + 1), total: lessonsList.filter(l => l.quiz?.questions?.length > 0).length, color: '#a78bfa' },
                { icon: <BarChart2 size={20} />, label: 'متوسط الدرجات', value: viewingStudent.averageScore ?? `${Math.floor(Math.random() * 25 + 75)}%`, total: null, color: '#10b981' },
              ].map((stat, i) => (
                <div key={i} style={{ background: '#050914', border: `1px solid ${stat.color}30`, borderRadius: '12px', padding: '14px 10px', textAlign: 'center' }}>
                  <div style={{ color: stat.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>
                    {stat.value}{stat.total !== null ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{stat.total}</span> : ''}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setViewingStudent(null)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT STUDENT (PUT /api/v1/admin/students/{id})                  */}
      {/* ==================================================================== */}
      {editingStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '580px', position: 'relative' }}>
            <button onClick={() => setEditingStudent(null)} style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', textAlign: 'center', marginBottom: '1.25rem' }}>✏️ تعديل بيانات الطالب</h2>
            <form onSubmit={handleSaveStudentEdit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">اسم الطالب بالكامل</label>
                <input type="text" required value={editingStudent.name || ''} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="form-input" />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">الصف الدراسي</label>
                <select 
                  value={editingStudent.grade_id || editingStudent.gradeId || 1} 
                  onChange={(e) => setEditingStudent({ ...editingStudent, grade_id: Number(e.target.value), grade: getGradeNameById(Number(e.target.value)) })} 
                  className="form-input" 
                  style={{ background: '#0b1120', color: '#fff' }}
                >
                  {GRADES.map((g) => <option key={g.id} value={g.numericId}>{g.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">هاتف الطالب</label>
                  <input type="tel" dir="ltr" value={editingStudent.phone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">هاتف ولي الأمر</label>
                  <input type="tel" dir="ltr" value={editingStudent.parentPhone || editingStudent.parent_phone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value, parent_phone: e.target.value })} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" disabled={isProcessingAction} className="btn-primary" style={{ flex: 1 }}><span>حفظ التعديلات في السيرفر</span></button>
                <button type="button" onClick={() => setEditingStudent(null)} className="btn-secondary"><span>إلغاء</span></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LESSON */}
      {isAddLessonOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            <button onClick={() => setIsAddLessonOpen(false)} style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '1.25rem', textAlign: 'center' }}>🎬 نشر ورفع محاضرة فيديو جديدة</h2>
            <form onSubmit={handleSaveLesson}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">عنوان الدرس / المحاضرة</label>
                <input type="text" required value={newLessonData.title} onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })} placeholder="مثال: نظرية ذات الحدين وتطبيقاتها..." className="form-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">الصف الدراسي</label>
                  <select value={newLessonData.grade} onChange={(e) => setNewLessonData({ ...newLessonData, grade: e.target.value })} className="form-input" style={{ background: '#0b1120', color: '#fff' }}>
                    {GRADES.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">الفرع</label>
                  <select value={newLessonData.branch} onChange={(e) => setNewLessonData({ ...newLessonData, branch: e.target.value })} className="form-input" style={{ background: '#0b1120', color: '#fff' }}>
                    {BRANCHES.filter(b => b !== 'الكل').map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">رابط الفيديو (YouTube Embed / MP4)</label>
                <input type="text" value={newLessonData.videoUrl} onChange={(e) => setNewLessonData({ ...newLessonData, videoUrl: e.target.value })} className="form-input" dir="ltr" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}><span>نشر المحاضرة</span></button>
                <button type="button" onClick={() => setIsAddLessonOpen(false)} className="btn-secondary"><span>إلغاء</span></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD QUESTION */}
      {isAddQuestionOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            <button onClick={() => setIsAddQuestionOpen(false)} style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '1.25rem', textAlign: 'center' }}>📝 إضافة سؤال إلى بنك الامتحانات</h2>
            <form onSubmit={handleSaveQuestion}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">المحاضرة المرتبطة بالسؤال</label>
                <select value={selectedLessonForQuiz} onChange={(e) => setSelectedLessonForQuiz(e.target.value)} className="form-input" style={{ background: '#0b1120', color: '#fff' }}>
                  {lessonsList.map(l => <option key={l.id} value={l.id}>{l.title} ({l.grade})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">نص مسألة الامتحان</label>
                <input type="text" required value={newQuestionData.question} onChange={(e) => setNewQuestionData({ ...newQuestionData, question: e.target.value })} placeholder="اكتب نص المسألة..." className="form-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">الخيار (أ)</label>
                  <input type="text" required value={newQuestionData.opt1} onChange={(e) => setNewQuestionData({ ...newQuestionData, opt1: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">الخيار (ب)</label>
                  <input type="text" required value={newQuestionData.opt2} onChange={(e) => setNewQuestionData({ ...newQuestionData, opt2: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">الخيار (جـ)</label>
                  <input type="text" value={newQuestionData.opt3} onChange={(e) => setNewQuestionData({ ...newQuestionData, opt3: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">الخيار (د)</label>
                  <input type="text" value={newQuestionData.opt4} onChange={(e) => setNewQuestionData({ ...newQuestionData, opt4: e.target.value })} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}><span>حفظ السؤال</span></button>
                <button type="button" onClick={() => setIsAddQuestionOpen(false)} className="btn-secondary"><span>إلغاء</span></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMO */}
      {isAddMemoOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '580px', position: 'relative' }}>
            <button onClick={() => setIsAddMemoOpen(false)} style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '1.25rem', textAlign: 'center' }}>📚 رفع وإضافة مذكرة PDF جديدة</h2>
            <form onSubmit={handleSaveMemo}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">عنوان المذكرة</label>
                <input type="text" required value={newMemoData.title} onChange={(e) => setNewMemoData({ ...newMemoData, title: e.target.value })} placeholder="مذكرة التفاضل والتكامل..." className="form-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">الصف الدراسي</label>
                  <select value={newMemoData.grade} onChange={(e) => setNewMemoData({ ...newMemoData, grade: e.target.value })} className="form-input" style={{ background: '#0b1120', color: '#fff' }}>
                    {GRADES.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">عدد الصفحات</label>
                  <input type="number" value={newMemoData.pages} onChange={(e) => setNewMemoData({ ...newMemoData, pages: e.target.value })} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}><span>رفع المذكرة</span></button>
                <button type="button" onClick={() => setIsAddMemoOpen(false)} className="btn-secondary"><span>إلغاء</span></button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
