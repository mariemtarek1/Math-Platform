import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_STUDENT, 
  INITIAL_STUDENTS_LIST, 
  LESSONS_DATA, 
  MEMOS_DATA, 
  GRADES,
  TEACHER_CODES,
  TEACHER_INFO 
} from '../data/platformData';
import api, { tokenStorage, getGradeNameById, getGradeIdByName } from '../services/api';

const StudentContext = createContext();

export function StudentProvider({ children }) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('el_eamid_auth');
      return saved ? JSON.parse(saved) : true; // Default logged in for smooth exploration
    } catch {
      return true;
    }
  });

  // Current active user role: 'student' | 'teacher' | null
  const [userRole, setUserRole] = useState(() => {
    try {
      const saved = localStorage.getItem('el_eamid_role');
      return saved ? saved : 'student';
    } catch {
      return 'student';
    }
  });

  // Current active student profile (null if teacher or logged out)
  const [student, setStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('el_eamid_student');
      return saved ? JSON.parse(saved) : INITIAL_STUDENT;
    } catch {
      return INITIAL_STUDENT;
    }
  });

  // Students roster managed by Teacher & Registration
  const [studentsList, setStudentsList] = useState(() => {
    try {
      const saved = localStorage.getItem('el_eamid_students_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : INITIAL_STUDENTS_LIST;
      }
      return INITIAL_STUDENTS_LIST;
    } catch {
      return INITIAL_STUDENTS_LIST;
    }
  });

  // Backend API States: Pending Activation Requests & Approved Subscriptions
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedSubscriptions, setApprovedSubscriptions] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingApproved, setIsLoadingApproved] = useState(false);

  // Lessons list (Videos & Quizzes)
  const [lessonsList, setLessonsList] = useState(() => {
    try {
      const saved = localStorage.getItem('el_eamid_lessons_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length < LESSONS_DATA.length) {
          return LESSONS_DATA;
        }
        return parsed.map(l => ({
          ...l,
          videoUrl: (!l.videoUrl || l.videoUrl.includes('dQw4w9WgXcQ')) ? 'https://youtu.be/qJ-Op0x0yCM?si=HrcEYlkOUWW4X5m9' : l.videoUrl
        }));
      }
      return LESSONS_DATA;
    } catch {
      return LESSONS_DATA;
    }
  });

  // Memos list
  const [memosList, setMemosList] = useState(() => {
    try {
      const saved = localStorage.getItem('el_eamid_memos_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length < MEMOS_DATA.length) {
          return MEMOS_DATA;
        }
        return parsed;
      }
      return MEMOS_DATA;
    } catch {
      return MEMOS_DATA;
    }
  });

  const [toast, setToast] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // =========================================================
  // API LOADERS (Teacher / Admin)
  // =========================================================

  const fetchPendingRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const res = await api.getPendingActivationRequests();
      setPendingRequests(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  const fetchApprovedStudents = useCallback(async () => {
    setIsLoadingApproved(true);
    try {
      const res = await api.getApprovedStudents();
      setApprovedSubscriptions(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch approved students:', err);
    } finally {
      setIsLoadingApproved(false);
    }
  }, []);

  // Fetch data when authenticated as teacher
  useEffect(() => {
    if (isAuthenticated && userRole === 'teacher') {
      fetchPendingRequests();
      fetchApprovedStudents();
    }
  }, [isAuthenticated, userRole, fetchPendingRequests, fetchApprovedStudents]);

  // =========================================================
  // AUTHENTICATION & LOGIN ACTIONS
  // =========================================================

  /**
   * 1. Student Login using Subscription Code (POST /api/v1/auth/login)
   */
  const studentLoginWithCode = async (subscriptionCode) => {
    const trimmedCode = (subscriptionCode || '').trim().toUpperCase();
    if (!trimmedCode) {
      return { success: false, message: 'يرجى إدخال كود الاشتراك الخاص بك' };
    }

    try {
      const res = await api.studentLogin(trimmedCode);
      
      let matchedStudent = null;
      if (res.student) {
        matchedStudent = res.student;
      } else {
        // Find in local roster or create profile from returned data
        matchedStudent = studentsList.find(s => s.code?.toUpperCase() === trimmedCode) || {
          id: `std-${Date.now().toString().slice(-4)}`,
          code: trimmedCode,
          name: res.name || 'طالب متميز',
          grade: res.grade || getGradeNameById(res.grade_id || 1),
          gradeId: res.grade_id || 'sec3',
          phone: res.phone || '',
          parentPhone: res.parent_phone || '',
          governorate: 'القاهرة',
          attendanceRate: '100%',
          completedQuizzes: 0,
          averageScore: '100%'
        };
      }

      setStudent(matchedStudent);
      setUserRole('student');
      setIsAuthenticated(true);

      localStorage.setItem('el_eamid_auth', JSON.stringify(true));
      localStorage.setItem('el_eamid_student', JSON.stringify(matchedStudent));
      localStorage.setItem('el_eamid_role', 'student');

      showToast(`أهلاً بك يا ${matchedStudent.name}! تم فتح محتوى (${matchedStudent.grade}) 🎓`);
      return { success: true, role: 'student', student: matchedStudent };
    } catch (err) {
      return { success: false, message: err.message || 'كود الاشتراك غير صحيح أو غير مفعل بعد' };
    }
  };

  /**
   * 2. Submit Student Activation Request (POST /api/v1/auth/activate)
   */
  const submitActivationRequest = async ({ firstName, lastName, phone, parentPhone, gradeId }) => {
    try {
      const res = await api.activateStudent({
        first_name: firstName,
        last_name: lastName,
        phone,
        parent_phone: parentPhone,
        grade_id: gradeId
      });

      // Also add to local studentsList as a pending entry for display
      const gradeName = getGradeNameById(gradeId);
      const newPendingStd = {
        id: `std-${Date.now().toString().slice(-4)}`,
        name: `${firstName} ${lastName}`.trim(),
        grade: gradeName,
        phone,
        parentPhone,
        status: 'pending',
        registeredAt: new Date().toISOString().split('T')[0]
      };
      setStudentsList(prev => [newPendingStd, ...prev]);

      showToast('تم تقديم طلب التفعيل بنجاح! في انتظار موافقة المعلم لمنحك كود الدخول ✨');
      return {
        success: true,
        message: res.message || 'تم تقديم طلب التفعيل بنجاح. يرجى انتظار موافقة المعلم.',
        status: 'pending'
      };
    } catch (err) {
      return { success: false, message: err.message || 'فشل إرسال طلب التفعيل' };
    }
  };

  /**
   * 3. Admin Login with Email & Password (POST /api/v1/admin/auth/login)
   */
  const adminLoginWithCredentials = async (email, password) => {
    try {
      const res = await api.adminLogin(email, password);
      setUserRole('teacher');
      setIsAuthenticated(true);
      
      localStorage.setItem('el_eamid_auth', JSON.stringify(true));
      localStorage.setItem('el_eamid_role', 'teacher');

      showToast('مرحباً بك يا مستر محمد عبد الخالق! تم تسجيل دخول لوحة تحكم المعلم الشاملة 👨‍🏫');
      
      // Trigger background loads
      fetchPendingRequests();
      fetchApprovedStudents();

      return { success: true, role: 'teacher', data: res };
    } catch (err) {
      return { success: false, message: err.message || 'البريد أو كلمة المرور غير صحيحة' };
    }
  };

  /**
   * 4. Approve Activation Request (POST /api/v1/admin/activation-requests/{id}/approve)
   */
  const approveActivationRequest = async (subscriptionId) => {
    try {
      const res = await api.approveActivationRequest(subscriptionId);
      showToast(res.message || 'تمت الموافقة وتفعيل كود الاشتراك بنجاح! 🎉');
      await Promise.all([fetchPendingRequests(), fetchApprovedStudents()]);
      return { success: true, data: res };
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء الموافقة على الطلب');
      return { success: false, message: err.message };
    }
  };

  /**
   * 4b. Reject Activation Request
   */
  const rejectActivationRequest = async (subscriptionId) => {
    try {
      const res = await api.rejectActivationRequest(subscriptionId);
      showToast(res.message || 'تم رفض الطلب وحذفه من قائمة الانتظار');
      await fetchPendingRequests();
      return { success: true };
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء رفض الطلب');
      return { success: false, message: err.message };
    }
  };

  /**
   * 5. Deactivate Subscription (POST /api/v1/admin/subscriptions/{id}/deactivate)
   */
  const deactivateStudentSubscription = async (subscriptionId) => {
    try {
      const res = await api.deactivateSubscription(subscriptionId);
      showToast(res.message || 'تم تعطيل الاشتراك بنجاح');
      await fetchApprovedStudents();
      return { success: true, data: res };
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء تعطيل الاشتراك');
      return { success: false, message: err.message };
    }
  };

  /**
   * 6. Create Student by Admin (POST /api/v1/admin/students)
   */
  const createStudentByAdmin = async (studentData) => {
    try {
      const res = await api.createStudentByAdmin(studentData);
      showToast(res.message || 'تم إنشاء وتفعيل حساب الطالب بنجاح! 🚀');
      await fetchApprovedStudents();
      return { success: true, data: res };
    } catch (err) {
      showToast(err.message || 'فشل إنشاء حساب الطالب');
      return { success: false, message: err.message };
    }
  };

  /**
   * 7. Update Student by Admin (PUT /api/v1/admin/students/{id})
   */
  const updateStudentByAdmin = async (studentId, studentData) => {
    try {
      const res = await api.updateStudent(studentId, studentData);
      showToast(res.message || 'تم تحديث بيانات الطالب بنجاح ✅');
      await fetchApprovedStudents();
      return { success: true, data: res };
    } catch (err) {
      showToast(err.message || 'فشل تحديث بيانات الطالب');
      return { success: false, message: err.message };
    }
  };

  // Backwards compatible loginWithCredentials
  const loginWithCredentials = ({ name = '', grade = '', code = '' }) => {
    const trimmedCode = (code || '').trim().toUpperCase();
    const isTeacher = TEACHER_CODES.some(tc => tc.toUpperCase() === trimmedCode) || grade === 'معلم' || grade.includes('المعلم');
    
    if (isTeacher) {
      setUserRole('teacher');
      setIsAuthenticated(true);
      localStorage.setItem('el_eamid_auth', JSON.stringify(true));
      localStorage.setItem('el_eamid_role', 'teacher');
      showToast('مرحباً بك مستر / محمد عبد الخالق! تم فتح لوحة تحكم المعلم الشاملة 👨‍🏫');
      fetchPendingRequests();
      fetchApprovedStudents();
      return { success: true, role: 'teacher' };
    }

    // Try API student login with code
    studentLoginWithCode(trimmedCode);
    return { success: true, role: 'student' };
  };

  const loginWithCode = (rawCode) => {
    return studentLoginWithCode(rawCode);
  };

  // Register New Student (Local fallback wrapper)
  const registerStudent = (formData) => {
    const gradeObj = GRADES.find(g => g.name === formData.grade || g.id === formData.gradeId) || GRADES[0];
    const nameParts = (formData.name || '').trim().split(' ');
    const firstName = nameParts[0] || 'طالب';
    const lastName = nameParts.slice(1).join(' ') || 'جديد';

    return submitActivationRequest({
      firstName,
      lastName,
      phone: formData.phone || '',
      parentPhone: formData.parentPhone || '',
      gradeId: gradeObj.numericId || 1
    });
  };

  const logout = async () => {
    if (userRole === 'student') {
      await api.studentLogout();
    } else {
      api.adminLogout();
    }

    tokenStorage.clearTokens();
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.setItem('el_eamid_auth', JSON.stringify(false));
    localStorage.removeItem('el_eamid_role');
    showToast('تم تسجيل الخروج بنجاح. يمكنك إدخال كود آخر للدخول.');
  };

  const switchRole = (role) => {
    setUserRole(role);
    setIsAuthenticated(true);
    localStorage.setItem('el_eamid_auth', JSON.stringify(true));
    localStorage.setItem('el_eamid_role', role);
    showToast(role === 'teacher' ? 'تم الدخول كـ (مستر / محمد عبد الخالق) 👨‍🏫' : 'تم تفعيل وضع الطالب 🎓');
  };

  const selectActiveStudent = (stdObj) => {
    setStudent(stdObj);
    setUserRole('student');
    setIsAuthenticated(true);
    localStorage.setItem('el_eamid_auth', JSON.stringify(true));
    localStorage.setItem('el_eamid_student', JSON.stringify(stdObj));
    localStorage.setItem('el_eamid_role', 'student');
    showToast(`تم تفعيل حساب: ${stdObj.name} (${stdObj.grade})`);
  };

  // LESSONS MANAGEMENT (Teacher)
  const addLesson = (newLesson) => {
    const createdLesson = {
      id: Date.now(),
      number: String(lessonsList.length + 1).padStart(2, '0'),
      videoThumbnail: '/teacher.png',
      ...newLesson,
    };
    const updated = [createdLesson, ...lessonsList];
    setLessonsList(updated);
    localStorage.setItem('el_eamid_lessons_list', JSON.stringify(updated));
    showToast(`تم نشر المحاضرة: ${createdLesson.title} بنجاح! 🎬`);
  };

  const updateLesson = (id, fields) => {
    const updated = lessonsList.map(l => l.id === id ? { ...l, ...fields } : l);
    setLessonsList(updated);
    localStorage.setItem('el_eamid_lessons_list', JSON.stringify(updated));
    showToast('تم تحديث بيانات الدرس بنجاح ✅');
  };

  const deleteLesson = (id) => {
    const updated = lessonsList.filter(l => l.id !== id);
    setLessonsList(updated);
    localStorage.setItem('el_eamid_lessons_list', JSON.stringify(updated));
    showToast('تم حذف الدرس بنجاح');
  };

  // QUIZZES MANAGEMENT (Teacher)
  const addQuestionToLessonQuiz = (lessonId, newQuestion) => {
    const updated = lessonsList.map(l => {
      if (l.id === lessonId) {
        const currentQuestions = l.quiz?.questions || [];
        const questionObj = {
          id: Date.now(),
          ...newQuestion,
        };
        const updatedQuiz = {
          title: l.quiz?.title || `اختبار تقييمي: ${l.title}`,
          durationMinutes: l.quiz?.durationMinutes || 15,
          questions: [...currentQuestions, questionObj],
        };
        return { ...l, quiz: updatedQuiz };
      }
      return l;
    });

    setLessonsList(updated);
    localStorage.setItem('el_eamid_lessons_list', JSON.stringify(updated));
    showToast('تمت إضافة السؤال بنجاح إلى بنك الأسئلة! 📝');
  };

  const deleteQuestionFromQuiz = (lessonId, questionId) => {
    const updated = lessonsList.map(l => {
      if (l.id === lessonId && l.quiz) {
        const filteredQ = (l.quiz.questions || []).filter(q => q.id !== questionId);
        return { ...l, quiz: { ...l.quiz, questions: filteredQ } };
      }
      return l;
    });
    setLessonsList(updated);
    localStorage.setItem('el_eamid_lessons_list', JSON.stringify(updated));
    showToast('تم حذف السؤال من الاختبار');
  };

  // MEMOS MANAGEMENT (Teacher)
  const addMemo = (newMemo) => {
    const createdMemo = {
      id: Date.now(),
      cover: '/logo.png',
      year: '2026 / 2027',
      features: newMemo.features || ['شرح وافٍ بالخرائط الذهنية', 'أكثر من 500 سؤال تابلت'],
      ...newMemo,
    };
    const updated = [createdMemo, ...memosList];
    setMemosList(updated);
    localStorage.setItem('el_eamid_memos_list', JSON.stringify(updated));
    showToast(`تم رفع مذكرة: ${createdMemo.title} بنجاح! 📚`);
  };

  const deleteMemo = (id) => {
    const updated = memosList.filter(m => m.id !== id);
    setMemosList(updated);
    localStorage.setItem('el_eamid_memos_list', JSON.stringify(updated));
    showToast('تم حذف المذكرة بنجاح');
  };

  // LOCAL STUDENTS CRUD (For compatibility)
  const addStudentByTeacher = (newStudentData) => {
    const gradeObj = GRADES.find(g => g.name === newStudentData.grade) || GRADES[0];
    const nameParts = (newStudentData.name || '').trim().split(' ');
    createStudentByAdmin({
      first_name: nameParts[0] || 'طالب',
      last_name: nameParts.slice(1).join(' ') || 'جديد',
      phone: newStudentData.phone || '',
      parent_phone: newStudentData.parentPhone || '',
      grade_id: gradeObj.numericId || 1
    });
  };

  const updateStudentByTeacher = (id, updatedFields) => {
    const gradeObj = GRADES.find(g => g.name === updatedFields.grade) || GRADES[0];
    const nameParts = (updatedFields.name || '').trim().split(' ');
    updateStudentByAdmin(id, {
      first_name: nameParts[0] || 'طالب',
      last_name: nameParts.slice(1).join(' ') || 'جديد',
      phone: updatedFields.phone || '',
      parent_phone: updatedFields.parentPhone || '',
      grade_id: gradeObj.numericId || 1
    });
  };

  const deleteStudentByTeacher = (id) => {
    deactivateStudentSubscription(id);
  };

  return (
    <StudentContext.Provider value={{ 
      isAuthenticated,
      userRole, 
      student, 
      studentsList, 
      pendingRequests,
      approvedSubscriptions,
      isLoadingRequests,
      isLoadingApproved,
      lessonsList,
      memosList,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      studentLoginWithCode,
      submitActivationRequest,
      adminLoginWithCredentials,
      fetchPendingRequests,
      approveActivationRequest,
      rejectActivationRequest,
      fetchApprovedStudents,
      deactivateStudentSubscription,
      createStudentByAdmin,
      updateStudentByAdmin,
      loginWithCredentials,
      loginWithCode,
      registerStudent,
      logout,
      switchRole,
      selectActiveStudent,
      addLesson,
      updateLesson,
      deleteLesson,
      addQuestionToLessonQuiz,
      deleteQuestionFromQuiz,
      addMemo,
      deleteMemo,
      addStudentByTeacher, 
      updateStudentByTeacher, 
      deleteStudentByTeacher, 
      toast, 
      showToast 
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
