import { useCallback, useEffect, useState } from "react";

import {
  INITIAL_STUDENT,
  INITIAL_STUDENTS_LIST,
  LESSONS_DATA,
  MEMOS_DATA,
  GRADES,
  TEACHER_CODES,
  TEACHER_INFO,
} from "../data/platformData";

import {
  api,
  tokenStorage,
  getGradeNameById,
  getGradeIdByName,
  getOrCreateDeviceId,
} from "../services/api";

import { StudentContext } from "./StudentContextValue";

export const StudentProvider = ({ children }) => {
  // ============================================================
  // AUTH STATE
  // ============================================================

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("el_eamid_auth") === "true";
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("el_eamid_role") || "student";
  });

  const [student, setStudent] = useState(() => {
    try {
      const savedStudent = localStorage.getItem("el_eamid_student");
      return savedStudent ? JSON.parse(savedStudent) : INITIAL_STUDENT;
    } catch {
      return INITIAL_STUDENT;
    }
  });

  const [studentsList, setStudentsList] = useState(() => {
    try {
      const savedStudents = localStorage.getItem("el_eamid_students_list");
      return savedStudents ? JSON.parse(savedStudents) : INITIAL_STUDENTS_LIST;
    } catch {
      return INITIAL_STUDENTS_LIST;
    }
  });

  // ============================================================
  // REQUESTS / SUBSCRIPTIONS
  // ============================================================

  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedSubscriptions, setApprovedSubscriptions] = useState([]);

  const [pendingLoading, setPendingLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);

  // ============================================================
  // ADMIN EXAMS & QUESTIONS
  // ============================================================

  const [adminExamsList, setAdminExamsList] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);

  // ============================================================
  // SUBSCRIPTION CODES (BY GRADE)
  // ============================================================

  const [subscriptionCodesList, setSubscriptionCodesList] = useState([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);

  // ============================================================
  // ADMIN PAGINATED STUDENTS
  // ============================================================

  const [paginatedStudents, setPaginatedStudents] = useState([]);
  const [studentsPagination, setStudentsPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  // ============================================================
  // LESSONS
  // ============================================================

  const [lessonsList, setLessonsList] = useState(() => {
    try {
      const savedLessons = localStorage.getItem("el_eamid_lessons_list");

      if (!savedLessons) {
        return LESSONS_DATA;
      }

      const parsedLessons = JSON.parse(savedLessons);

      if (!Array.isArray(parsedLessons)) {
        return LESSONS_DATA;
      }

      if (parsedLessons.length < LESSONS_DATA.length) {
        return LESSONS_DATA;
      }

      return parsedLessons.map((lesson) => ({
        ...lesson,
        videoUrl:
          !lesson.videoUrl || lesson.videoUrl.includes("dQw4w9WgXcQ")
            ? "https://youtu.be/qJ-Op0x0yCM?si=HrcEYlkOUWW4X5m9"
            : lesson.videoUrl,
      }));
    } catch {
      return LESSONS_DATA;
    }
  });

  // ============================================================
  // MEMOS
  // ============================================================

  const [memosList, setMemosList] = useState(() => {
    try {
      const savedMemos = localStorage.getItem("el_eamid_memos_list");

      return savedMemos ? JSON.parse(savedMemos) : MEMOS_DATA;
    } catch {
      return MEMOS_DATA;
    }
  });

  // ============================================================
  // UI STATE
  // ============================================================

  const [toast, setToast] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ============================================================
  // TOAST
  // ============================================================

  const showToast = useCallback((message, type = "success") => {
    setToast({
      message,
      type,
      id: Date.now(),
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // ============================================================
  // AUTH MODAL
  // ============================================================

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // ============================================================
  // FETCH PENDING REQUESTS
  // ============================================================

  const fetchPendingRequests = useCallback(async () => {
    setPendingLoading(true);

    try {
      const result = await api.getActivationRequests();

      if (result?.success) {
        setPendingRequests(result.data || []);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      setPendingRequests([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  // ============================================================
  // FETCH APPROVED STUDENTS
  // ============================================================

  const fetchApprovedStudents = useCallback(async () => {
    setApprovedLoading(true);

    try {
      const result = await api.getApprovedStudents();

      if (result?.success) {
        setApprovedSubscriptions(result.data || []);
      } else {
        setApprovedSubscriptions([]);
      }
    } catch (error) {
      console.error("Failed to fetch approved students:", error);
      setApprovedSubscriptions([]);
    } finally {
      setApprovedLoading(false);
    }
  }, []);

  // ============================================================
  // FETCH STUDENT PROFILE
  // ============================================================

  const fetchStudentProfile = useCallback(async () => {
    const token = tokenStorage.getStudentToken();

    if (!token) {
      return;
    }

    try {
      const result = await api.getStudentProfile();

      if (result?.success && result.data) {
        const profile = result.data;

        setStudent((prev) => {
          const profileStudent = profile.student || profile;

          return {
            ...prev,
            ...profileStudent,
            grade:
              getGradeNameById(
                profileStudent.grade_id || prev?.grade_id || 1,
              ) || prev?.grade,
            trusted_device:
              profile.trusted_device || profile.device || prev?.trusted_device,
          };
        });
      }
    } catch (error) {
      console.error("Failed to fetch student profile:", error);
    }
  }, []);

  // ============================================================
  // STUDENT LOGIN WITH CODE
  // ============================================================

  const studentLoginWithCode = useCallback(
    async (subscriptionCode) => {
      const code = String(subscriptionCode || "")
        .trim()
        .toUpperCase();

      if (!code) {
        showToast("من فضلك أدخل كود الاشتراك", "error");

        return {
          success: false,
          message: "Subscription code is required",
        };
      }

      try {
        const deviceId = getOrCreateDeviceId();

        const result = await api.studentLogin({
          subscription_code: code,
          device_identifier: deviceId,
        });

        if (!result?.success) {
          showToast(result?.message || "كود الاشتراك غير صحيح", "error");

          return result;
        }

        const data = result.data || {};

        if (data.token) {
          tokenStorage.setStudentToken(data.token);
        }

        const loggedStudent = {
          ...INITIAL_STUDENT,
          ...(data.student || data.user || {}),
          subscription_code:
            data.student?.subscription_code || data.subscription_code || code,
        };

        setStudent(loggedStudent);
        setUserRole("student");
        setIsAuthenticated(true);

        localStorage.setItem("el_eamid_auth", "true");
        localStorage.setItem("el_eamid_role", "student");
        localStorage.setItem("el_eamid_student", JSON.stringify(loggedStudent));

        showToast("تم تسجيل الدخول بنجاح");

        return {
          success: true,
          role: "student",
          data,
        };
      } catch (error) {
        console.error("Student login error:", error);

        showToast("حدث خطأ أثناء تسجيل الدخول", "error");

        return {
          success: false,
          message: error?.message || "Login failed",
        };
      }
    },
    [showToast],
  );

  // ============================================================
  // ACTIVATION REQUEST
  // ============================================================

  const submitActivationRequest = useCallback(
    async (studentData) => {
      try {
        const result = await api.activateStudent(studentData);

        if (!result?.success) {
          showToast(result?.message || "فشل إرسال طلب التفعيل", "error");

          return result;
        }

        const newRequest = {
          id: Date.now(),
          ...studentData,
          status: "pending",
        };

        setPendingRequests((prev) => [...prev, newRequest]);

        showToast("تم إرسال طلب التفعيل بنجاح");

        return result;
      } catch (error) {
        console.error("Activation request error:", error);

        showToast("حدث خطأ أثناء إرسال الطلب", "error");

        return {
          success: false,
          message: error?.message || "Activation failed",
        };
      }
    },
    [showToast],
  );

  // ============================================================
  // ADMIN LOGIN
  // ============================================================

  const adminLoginWithCredentials = useCallback(
    async (credentials) => {
      try {
        const result = await api.adminLogin(credentials);

        console.log("Admin login API result:", result);

        if (!result?.success) {
          showToast(
            result?.message || "بيانات تسجيل الدخول غير صحيحة",
            "error",
          );

          return result;
        }

        const token =
          result?.token ||
          result?.data?.token ||
          result?.access_token ||
          result?.data?.access_token;

        if (!token) {
          console.error(
            "Admin login succeeded but no token was returned:",
            result,
          );

          showToast("تم تسجيل الدخول لكن لم يتم استلام رمز الدخول", "error");

          return {
            success: false,
            message: "No admin token returned from API",
          };
        }

        tokenStorage.setAdminToken(token);

        setUserRole("teacher");
        setIsAuthenticated(true);

        localStorage.setItem("el_eamid_auth", "true");
        localStorage.setItem("el_eamid_role", "teacher");

        showToast("تم تسجيل الدخول بنجاح");

        return {
          success: true,
          role: "teacher",
          token,
          data: result?.data || {},
        };
      } catch (error) {
        console.error("Admin login error:", error);

        showToast("حدث خطأ أثناء تسجيل الدخول", "error");

        return {
          success: false,
          message: error?.message || "Login failed",
        };
      }
    },
    [showToast],
  );

  // ============================================================
  // APPROVE REQUEST
  // ============================================================

  const approveRequest = useCallback(
    async (requestId) => {
      try {
        const result = await api.approveActivationRequest(requestId);

        if (!result?.success) {
          showToast(result?.message || "فشل قبول الطلب", "error");

          return result;
        }

        showToast("تم قبول الطلب بنجاح");

        await fetchPendingRequests();
        await fetchApprovedStudents();

        return result;
      } catch (error) {
        console.error("Approve request error:", error);

        showToast("حدث خطأ أثناء قبول الطلب", "error");

        return {
          success: false,
          message: error?.message || "Approval failed",
        };
      }
    },
    [fetchPendingRequests, fetchApprovedStudents, showToast],
  );

  // ============================================================
  // CANCEL REQUEST
  // ============================================================

  const cancelRequest = useCallback(
    async (requestId) => {
      try {
        const result = await api.cancelActivationRequest(requestId);

        if (!result?.success) {
          showToast(result?.message || "فشل إلغاء الطلب", "error");

          return result;
        }

        showToast("تم إلغاء الطلب");

        await fetchPendingRequests();

        return result;
      } catch (error) {
        console.error("Cancel request error:", error);

        showToast("حدث خطأ أثناء إلغاء الطلب", "error");

        return {
          success: false,
          message: error?.message || "Cancel failed",
        };
      }
    },
    [fetchPendingRequests, showToast],
  );

  // ============================================================
  // PAGINATED STUDENTS (GET /api/v1/admin/students?page=)
  // ============================================================

  const fetchAdminStudents = useCallback(async (page = 1) => {
    setIsLoadingStudents(true);
    try {
      const res = await api.getAllStudents(page);
      if (res) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        setPaginatedStudents(list);
        setStudentsPagination({
          current_page: res.current_page || page,
          last_page: res.last_page || 1,
          total: res.total || list.length,
        });
        return res;
      }
    } catch (error) {
      console.error("Failed to fetch paginated students:", error);
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  // ============================================================
  // DEACTIVATE STUDENT
  // ============================================================

  const deactivateStudent = useCallback(
    async (studentId) => {
      try {
        const result = await api.deactivateStudent(studentId);

        if (!result?.success) {
          showToast(result?.message || "فشل إلغاء تفعيل الطالب", "error");

          return result;
        }

        showToast("تم إلغاء تفعيل الطالب");

        await fetchApprovedStudents();
        await fetchAdminStudents();

        return result;
      } catch (error) {
        console.error("Deactivate student error:", error);

        showToast("حدث خطأ", "error");

        return {
          success: false,
          message: error?.message || "Deactivation failed",
        };
      }
    },
    [fetchApprovedStudents, fetchAdminStudents, showToast],
  );

  // ============================================================
  // RESET DEVICE
  // ============================================================

  const resetStudentDevice = useCallback(
    async (studentId) => {
      try {
        const result = await api.resetStudentDevice(studentId);

        if (!result?.success) {
          showToast(result?.message || "فشل إعادة ضبط الجهاز", "error");

          return result;
        }

        showToast("تم إعادة ضبط الجهاز بنجاح");

        await fetchApprovedStudents();
        await fetchAdminStudents();

        return result;
      } catch (error) {
        console.error("Reset device error:", error);

        showToast("حدث خطأ", "error");

        return {
          success: false,
          message: error?.message || "Reset failed",
        };
      }
    },
    [fetchApprovedStudents, fetchAdminStudents, showToast],
  );

  // ============================================================
  // REACTIVATE STUDENT
  // ============================================================

  const reactivateStudent = useCallback(
    async (studentId) => {
      try {
        const result = await api.reactivateStudent(studentId);

        if (!result?.success) {
          showToast(
            result?.message || result?.error || "فشل إعادة تفعيل الطالب",
            "error",
          );

          return result;
        }

        showToast(result.message || "تمت إعادة تفعيل حساب الطالب بنجاح");

        await fetchApprovedStudents();
        await fetchAdminStudents();

        return result;
      } catch (error) {
        console.error("Reactivate student error:", error);

        showToast("حدث خطأ أثناء إعادة التفعيل", "error");

        return {
          success: false,
          message: error?.message || "Reactivation failed",
        };
      }
    },
    [fetchApprovedStudents, fetchAdminStudents, showToast],
  );

  // ============================================================
  // FETCH SUBSCRIPTION CODES (GET /api/v1/admin/subscription-codes)
  // ============================================================

  const fetchSubscriptionCodes = useCallback(
    async (grade = 1) => {
      setIsLoadingCodes(true);
      try {
        const gradeId =
          typeof grade === "number"
            ? grade
            : isNaN(Number(grade))
              ? getGradeIdByName(grade)
              : Number(grade);

        const result = await api.getSubscriptionCodes(gradeId || 1);

        if (result?.success) {
          const list = Array.isArray(result.data)
            ? result.data
            : result.data?.data || [];
          setSubscriptionCodesList(list);
          return { success: true, data: list };
        } else {
          setSubscriptionCodesList([]);
          showToast(result?.message || "فشل تحميل أكواد الاشتراك", "error");
          return result;
        }
      } catch (error) {
        console.error("Subscription codes error:", error);
        setSubscriptionCodesList([]);
        return {
          success: false,
          message: error?.message || "Failed",
        };
      } finally {
        setIsLoadingCodes(false);
      }
    },
    [showToast],
  );

  // ============================================================
  // ADMIN EXAMS CRUD (GET, POST, PUT, DELETE /api/v1/admin/exams)
  // ============================================================

  const fetchAdminExams = useCallback(async () => {
    setIsLoadingExams(true);
    try {
      const exams = await api.getAdminExams();
      if (Array.isArray(exams)) {
        setAdminExamsList(exams);
        return exams;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch admin exams:", error);
      return [];
    } finally {
      setIsLoadingExams(false);
    }
  }, []);

  const createAdminExam = useCallback(
    async (payload) => {
      try {
        const res = await api.createAdminExam(payload);
        showToast("تم إنشاء الاختبار بنجاح");
        await fetchAdminExams();
        return { success: true, data: res?.data || res?.exam || res };
      } catch (error) {
        console.error("Create exam error:", error);
        showToast(error.message || "فشل إنشاء الاختبار", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  const updateAdminExam = useCallback(
    async (examId, payload) => {
      try {
        const res = await api.updateAdminExam(examId, payload);
        showToast("تم تعديل الاختبار بنجاح");
        await fetchAdminExams();
        return { success: true, data: res };
      } catch (error) {
        console.error("Update exam error:", error);
        showToast(error.message || "فشل تعديل الاختبار", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  const deleteAdminExam = useCallback(
    async (examId) => {
      try {
        await api.deleteAdminExam(examId);
        showToast("تم حذف الاختبار بنجاح");
        await fetchAdminExams();
        return { success: true };
      } catch (error) {
        console.error("Delete exam error:", error);
        showToast(error.message || "فشل حذف الاختبار", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  // ============================================================
  // QUESTIONS & OPTIONS CRUD
  // ============================================================

  const createAdminQuestion = useCallback(
    async (examId, payload) => {
      try {
        const res = await api.createAdminQuestion(examId, payload);
        showToast("تمت إضافة السؤال بنجاح");
        await fetchAdminExams();
        return { success: true, data: res?.data || res };
      } catch (error) {
        console.error("Create question error:", error);
        showToast(error.message || "فشل إضافة السؤال", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  const updateAdminQuestion = useCallback(
    async (questionId, payload) => {
      try {
        const res = await api.updateAdminQuestion(questionId, payload);
        showToast("تم تعديل السؤال بنجاح");
        await fetchAdminExams();
        return { success: true, data: res };
      } catch (error) {
        console.error("Update question error:", error);
        showToast(error.message || "فشل تعديل السؤال", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  const deleteAdminQuestion = useCallback(
    async (questionId) => {
      try {
        await api.deleteAdminQuestion(questionId);
        showToast("تم حذف السؤال بنجاح");
        await fetchAdminExams();
        return { success: true };
      } catch (error) {
        console.error("Delete question error:", error);
        showToast(error.message || "فشل حذف السؤال", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  const createAdminOption = useCallback(
    async (questionId, payload) => {
      try {
        const res = await api.createAdminOption(questionId, payload);
        showToast("تمت إضافة خيار الإجابة");
        await fetchAdminExams();
        return { success: true, data: res?.data || res };
      } catch (error) {
        console.error("Create option error:", error);
        showToast(error.message || "فشل إضافة الخيار", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  const updateAdminOption = useCallback(
    async (optionId, payload) => {
      try {
        const res = await api.updateAdminOption(optionId, payload);
        showToast("تم تعديل خيار الإجابة");
        await fetchAdminExams();
        return { success: true, data: res };
      } catch (error) {
        console.error("Update option error:", error);
        showToast(error.message || "فشل تعديل الخيار", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  const deleteAdminOption = useCallback(
    async (optionId) => {
      try {
        await api.deleteAdminOption(optionId);
        showToast("تم حذف خيار الإجابة");
        await fetchAdminExams();
        return { success: true };
      } catch (error) {
        console.error("Delete option error:", error);
        showToast(error.message || "فشل حذف الخيار", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchAdminExams, showToast],
  );

  // ============================================================
  // LESSONS FETCHING (GET /api/v1/admin/lessons or student/lessons)
  // ============================================================

  const fetchLessons = useCallback(
    async (gradeId = null) => {
      setIsLoadingLessons(true);
      try {
        if (userRole === "teacher") {
          const remoteLessons = await api.getAdminLessons(gradeId);
          if (Array.isArray(remoteLessons)) {
            setLessonsList(
              remoteLessons.map((l, idx) => ({
                ...l,
                id: l.id || idx + 1,
                number: idx + 1,
                title: l.title || "درس رياضيات",
                branch: l.section_name || l.branch || "الجبر والهندسة الفراغية",
                grade: getGradeNameById(l.grade_id || 1),
                gradeId: l.grade_id || 1,
                description: l.description || "",
                duration: l.duration || "45 دقيقة",
                videoUrl:
                  l.video_url ||
                  l.videoUrl ||
                  "https://youtu.be/qJ-Op0x0yCM?si=HrcEYlkOUWW4X5m9",
                quiz: l.quiz || {
                  title: `اختبار: ${l.title}`,
                  questions: [],
                },
              })),
            );
          }
        } else if (userRole === "student") {
          const studentLessons = await api.getStudentLessons();
          if (Array.isArray(studentLessons)) {
            setLessonsList(
              studentLessons.map((l, idx) => ({
                ...l,
                id: l.id || idx + 1,
                number: idx + 1,
                title: l.title || "درس رياضيات",
                branch: l.section_name || l.branch || "الجبر والهندسة الفراغية",
                grade: getGradeNameById(l.grade_id || 1),
                gradeId: l.grade_id || 1,
                description: l.description || "",
                duration: l.duration || "45 دقيقة",
                videoUrl:
                  l.video_url ||
                  l.videoUrl ||
                  "https://youtu.be/qJ-Op0x0yCM?si=HrcEYlkOUWW4X5m9",
                isCompleted: Boolean(l.is_completed),
                progress: l.progress || 0,
                accessStatus: l.access_status || "accessible",
                quiz: l.quiz || {
                  title: `اختبار: ${l.title}`,
                  questions: [],
                },
              })),
            );
          }
        }
      } catch (err) {
        console.warn("Fetch lessons notice:", err);
      } finally {
        setIsLoadingLessons(false);
      }
    },
    [userRole],
  );

  // ============================================================
  // STUDENT EXAMS & VIDEOS HELPERS
  // ============================================================

  const getStudentExam = useCallback(async (examId) => {
    return await api.getStudentExam(examId);
  }, []);

  const getStudentVideo = useCallback(async (videoId) => {
    return await api.getStudentVideo(videoId);
  }, []);

  // ============================================================
  // BACKWARD COMPATIBLE LOGIN
  // ============================================================

  const loginWithCredentials = useCallback(
    async ({ name = "", grade = "", code = "" }) => {
      const normalizedCode = String(code || "")
        .trim()
        .toUpperCase();

      const isTeacherCode = TEACHER_CODES?.some(
        (teacherCode) =>
          String(teacherCode).trim().toUpperCase() === normalizedCode,
      );

      const isTeacherGrade = String(grade || "")
        .toLowerCase()
        .includes("teacher");

      if (isTeacherCode || isTeacherGrade) {
        return adminLoginWithCredentials({
          name,
          grade,
          code: normalizedCode,
        });
      }

      return studentLoginWithCode(normalizedCode);
    },
    [adminLoginWithCredentials, studentLoginWithCode],
  );

  // ============================================================
  // LOGIN WITH CODE
  // ============================================================

  const loginWithCode = useCallback(
    async (code) => {
      return studentLoginWithCode(code);
    },
    [studentLoginWithCode],
  );

  // ============================================================
  // REGISTER STUDENT
  // ============================================================

  const registerStudent = useCallback(
    async (studentData) => {
      return submitActivationRequest(studentData);
    },
    [submitActivationRequest],
  );

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = useCallback(async () => {
    try {
      if (userRole === "student") {
        await api.studentLogout();
        tokenStorage.clearStudentToken();
      } else if (userRole === "teacher") {
        await api.adminLogout();
        tokenStorage.clearAdminToken();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    setIsAuthenticated(false);

    localStorage.removeItem("el_eamid_auth");
    localStorage.removeItem("el_eamid_role");
    localStorage.removeItem("el_eamid_student");

    setUserRole("student");
    setStudent(INITIAL_STUDENT);

    showToast("تم تسجيل الخروج");
  }, [userRole, showToast]);

  // ============================================================
  // SWITCH ROLE
  // ============================================================

  const switchRole = useCallback((role) => {
    setUserRole(role);

    localStorage.setItem("el_eamid_role", role);
  }, []);

  // ============================================================
  // SELECT ACTIVE STUDENT
  // ============================================================

  const selectActiveStudent = useCallback((selectedStudent) => {
    setStudent(selectedStudent);

    localStorage.setItem("el_eamid_student", JSON.stringify(selectedStudent));
  }, []);

  // ============================================================
  // LESSONS - ADD
  // ============================================================

  const addLesson = useCallback(
    async (lessonData) => {
      try {
        const gradeId =
          Number(lessonData.grade_id || lessonData.gradeId) ||
          getGradeIdByName(lessonData.grade);
        const result = await api.createAdminLesson({
          ...lessonData,
          grade_id: gradeId,
        });

        if (result?.success === false) {
          throw new Error(result.message || result.error || "فشل حفظ الدرس");
        }

        const savedLesson =
          result?.lesson ||
          result?.data?.lesson ||
          result?.data?.data ||
          result?.data ||
          result ||
          {};
        const localLesson = {
          ...lessonData,
          ...savedLesson,
          id: savedLesson.id || Date.now(),
          grade_id: gradeId,
          gradeId,
          videoUrl:
            savedLesson.video_url ||
            savedLesson.videoUrl ||
            lessonData.videoUrl,
        };

        setLessonsList((prev) => {
          const updated = [...prev, localLesson];
          localStorage.setItem(
            "el_eamid_lessons_list",
            JSON.stringify(updated),
          );
          return updated;
        });

        await fetchLessons();
        showToast(
          result?.isOfflineMode
            ? "تعذر الاتصال بالخادم؛ تم حفظ الدرس محليًا فقط"
            : "تم إضافة الدرس بنجاح",
          result?.isOfflineMode ? "error" : "success",
        );

        return {
          success: true,
          data: localLesson,
          isOfflineMode: result?.isOfflineMode,
        };
      } catch (error) {
        console.error("Create lesson API error:", error);
        showToast(error.message || "فشل إضافة الدرس إلى الخادم", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchLessons, showToast],
  );

  // ============================================================
  // LESSONS - UPDATE
  // ============================================================

  const updateLesson = useCallback(
    async (lessonId, updatedData) => {
      setLessonsList((prev) => {
        const updated = prev.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                ...updatedData,
              }
            : lesson,
        );

        localStorage.setItem("el_eamid_lessons_list", JSON.stringify(updated));

        return updated;
      });

      try {
        await api.updateAdminLesson(lessonId, updatedData);
      } catch (error) {
        console.error("Update lesson API error:", error);
      }

      showToast("تم تعديل الدرس بنجاح");
    },
    [showToast],
  );

  // ============================================================
  // LESSONS - DELETE
  // ============================================================

  const deleteLesson = useCallback(
    async (lessonId) => {
      try {
        const result = await api.deleteAdminLesson(lessonId);
        if (result?.success === false) {
          throw new Error(result.message || result.error || "فشل حذف الدرس");
        }

        setLessonsList((prev) => {
          const updated = prev.filter((lesson) => lesson.id !== lessonId);
          localStorage.setItem(
            "el_eamid_lessons_list",
            JSON.stringify(updated),
          );
          return updated;
        });

        await fetchLessons();
        showToast(
          result?.isOfflineMode
            ? "تعذر الاتصال بالخادم؛ تم الحذف محليًا فقط"
            : "تم حذف الدرس من الخادم",
          result?.isOfflineMode ? "error" : "success",
        );
        return { success: true, isOfflineMode: result?.isOfflineMode };
      } catch (error) {
        console.error("Delete lesson API error:", error);
        showToast(error.message || "فشل حذف الدرس من الخادم", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchLessons, showToast],
  );

  // ============================================================
  // QUIZ - ADD QUESTION
  // ============================================================

  const addQuestionToLessonQuiz = useCallback(
    (lessonId, question) => {
      setLessonsList((prev) => {
        const updated = prev.map((lesson) => {
          if (lesson.id !== lessonId) {
            return lesson;
          }

          return {
            ...lesson,
            quiz: {
              ...(lesson.quiz || {}),
              questions: [
                ...(lesson.quiz?.questions || []),
                {
                  id: Date.now(),
                  ...question,
                },
              ],
            },
          };
        });

        localStorage.setItem("el_eamid_lessons_list", JSON.stringify(updated));

        return updated;
      });

      showToast("تم إضافة السؤال");
    },
    [showToast],
  );

  // ============================================================
  // QUIZ - DELETE QUESTION
  // ============================================================

  const deleteQuestionFromQuiz = useCallback(
    (lessonId, questionId) => {
      setLessonsList((prev) => {
        const updated = prev.map((lesson) => {
          if (lesson.id !== lessonId) {
            return lesson;
          }

          return {
            ...lesson,
            quiz: {
              ...(lesson.quiz || {}),
              questions: (lesson.quiz?.questions || []).filter(
                (question) => question.id !== questionId,
              ),
            },
          };
        });

        localStorage.setItem("el_eamid_lessons_list", JSON.stringify(updated));

        return updated;
      });

      showToast("تم حذف السؤال");
    },
    [showToast],
  );

  // ============================================================
  // VIDEO PROGRESS
  // ============================================================

  const reportVideoProgress = useCallback(async (lessonId, progressData) => {
    try {
      const res = await api.updateVideoProgress(lessonId, progressData);

      if (progressData?.completion_percentage >= 90) {
        setLessonsList((prev) => {
          const updated = prev.map((l) =>
            l.id === Number(lessonId) || l.video_id === Number(lessonId)
              ? { ...l, isCompleted: true, progress: 100 }
              : l,
          );
          localStorage.setItem(
            "el_eamid_lessons_list",
            JSON.stringify(updated),
          );
          return updated;
        });
      }

      return res;
    } catch (error) {
      console.error("Video progress error:", error);

      return {
        success: false,
        message: error?.message || "Failed",
      };
    }
  }, []);

  // ============================================================
  // START EXAM
  // ============================================================

  const startExamAttempt = useCallback(async (examId) => {
    try {
      return await api.startExamAttempt(examId);
    } catch (error) {
      console.error("Start exam error:", error);

      return {
        success: false,
        message: error?.message || "Failed",
      };
    }
  }, []);

  // ============================================================
  // SUBMIT EXAM
  // ============================================================

  const submitExamAttempt = useCallback(async (examId, answers) => {
    try {
      return await api.submitExamAttempt(examId, answers);
    } catch (error) {
      console.error("Submit exam error:", error);

      return {
        success: false,
        message: error?.message || "Failed",
      };
    }
  }, []);

  // ============================================================
  // MEMOS - ADD
  // ============================================================

  const addMemo = useCallback(
    (memoData) => {
      const newMemo = {
        id: Date.now(),
        ...memoData,
      };

      setMemosList((prev) => {
        const updated = [...prev, newMemo];

        localStorage.setItem("el_eamid_memos_list", JSON.stringify(updated));

        return updated;
      });

      showToast("تم إضافة المذكرة");
    },
    [showToast],
  );

  // ============================================================
  // MEMOS - UPDATE
  // ============================================================

  const updateMemo = useCallback(
    (memoId, updatedData) => {
      setMemosList((prev) => {
        const updated = prev.map((memo) =>
          memo.id === memoId
            ? {
                ...memo,
                ...updatedData,
              }
            : memo,
        );

        localStorage.setItem("el_eamid_memos_list", JSON.stringify(updated));

        return updated;
      });

      showToast("تم تعديل المذكرة");
    },
    [showToast],
  );

  // ============================================================
  // MEMOS - DELETE
  // ============================================================

  const deleteMemo = useCallback(
    (memoId) => {
      setMemosList((prev) => {
        const updated = prev.filter((memo) => memo.id !== memoId);

        localStorage.setItem("el_eamid_memos_list", JSON.stringify(updated));

        return updated;
      });

      showToast("تم حذف المذكرة");
    },
    [showToast],
  );

  // ============================================================
  // LOCAL STUDENT CRUD
  // ============================================================

  const addStudent = useCallback(
    (studentData) => {
      const newStudent = {
        id: Date.now(),
        ...studentData,
      };

      setStudentsList((prev) => {
        const updated = [...prev, newStudent];

        localStorage.setItem("el_eamid_students_list", JSON.stringify(updated));

        return updated;
      });

      showToast("تم إضافة الطالب");
    },
    [showToast],
  );

  const updateStudent = useCallback(
    (studentId, updatedData) => {
      setStudentsList((prev) => {
        const updated = prev.map((item) =>
          item.id === studentId
            ? {
                ...item,
                ...updatedData,
              }
            : item,
        );

        localStorage.setItem("el_eamid_students_list", JSON.stringify(updated));

        return updated;
      });

      showToast("تم تعديل بيانات الطالب");
    },
    [showToast],
  );

  const deleteStudent = useCallback(
    (studentId) => {
      setStudentsList((prev) => {
        const updated = prev.filter((item) => item.id !== studentId);

        localStorage.setItem("el_eamid_students_list", JSON.stringify(updated));

        return updated;
      });

      showToast("تم حذف الطالب");
    },
    [showToast],
  );

  // ============================================================
  // ADMIN STUDENT API INTEGRATION
  // ============================================================

  const createStudentByAdmin = useCallback(
    async (studentData) => {
      try {
        const result = await api.createStudentByAdmin(studentData);
        if (result?.success || result?.student || result?.id) {
          showToast(
            result?.message || "تم إنشاء حساب الطالب وتفعيل كود الاشتراك بنجاح",
          );
          await fetchApprovedStudents();
          return { success: true, ...result };
        }
        showToast(result?.message || "فشل إنشاء حساب الطالب", "error");
        return result;
      } catch (error) {
        console.error("Create student by admin error:", error);
        showToast(error.message || "حدث خطأ أثناء إنشاء الطالب", "error");
        return { success: false, message: error.message };
      }
    },
    [fetchApprovedStudents, showToast],
  );

  const updateStudentByAdmin = useCallback(
    async (studentId, updatedData) => {
      try {
        const result = await api.updateStudent(studentId, updatedData);
        showToast("تم تحديث بيانات الطالب بنجاح");
        await fetchApprovedStudents();
        return { success: true, ...result };
      } catch (error) {
        console.error("Update student error:", error);
        showToast(
          error.message || "حدث خطأ أثناء تحديث بيانات الطالب",
          "error",
        );
        return { success: false, message: error.message };
      }
    },
    [fetchApprovedStudents, showToast],
  );

  // ============================================================
  // LOAD DATA AFTER AUTHENTICATION
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const timer = setTimeout(() => {
      if (userRole === "teacher") {
        fetchPendingRequests();
        fetchApprovedStudents();
        fetchAdminExams();
        fetchSubscriptionCodes(1);
        fetchAdminStudents(1);
        fetchLessons();
      }

      if (userRole === "student") {
        fetchStudentProfile();
        fetchLessons();
      }
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isAuthenticated,
    userRole,
    fetchPendingRequests,
    fetchApprovedStudents,
    fetchAdminExams,
    fetchSubscriptionCodes,
    fetchAdminStudents,
    fetchLessons,
    fetchStudentProfile,
  ]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value = {
    // Auth
    isAuthenticated,
    setIsAuthenticated,
    userRole,
    setUserRole,
    student,
    setStudent,
    studentsList,
    setStudentsList,

    // Requests
    pendingRequests,
    approvedSubscriptions,
    pendingLoading,
    approvedLoading,
    isLoadingRequests: pendingLoading,
    isLoadingApproved: approvedLoading,
    fetchPendingRequests,
    fetchApprovedStudents,

    // Subscription Codes (Admin)
    subscriptionCodesList,
    isLoadingCodes,
    fetchSubscriptionCodes,

    // Admin Exams & Questions & Options
    adminExamsList,
    isLoadingExams,
    fetchAdminExams,
    createAdminExam,
    updateAdminExam,
    deleteAdminExam,
    createAdminQuestion,
    updateAdminQuestion,
    deleteAdminQuestion,
    createAdminOption,
    updateAdminOption,
    deleteAdminOption,

    // Admin Students Pagination
    paginatedStudents,
    studentsPagination,
    isLoadingStudents,
    fetchAdminStudents,

    // Profile
    fetchStudentProfile,

    // UI
    toast,
    setToast,
    showToast,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,

    // Authentication
    studentLoginWithCode,
    adminLoginWithCredentials,
    loginWithCredentials,
    loginWithCode,
    registerStudent,
    submitActivationRequest,
    logout,
    switchRole,
    selectActiveStudent,

    // Admin requests
    approveRequest,
    cancelRequest,
    deactivateStudent,
    resetStudentDevice,
    reactivateStudent,
    approveActivationRequest: approveRequest,
    cancelActivationRequest: cancelRequest,
    deactivateStudentSubscription: deactivateStudent,
    resetTrustedDevice: resetStudentDevice,
    reactivateStudentSubscription: reactivateStudent,

    // Lessons
    lessonsList,
    setLessonsList,
    isLoadingLessons,
    fetchLessons,
    addLesson,
    updateLesson,
    deleteLesson,

    // Quiz
    addQuestionToLessonQuiz,
    deleteQuestionFromQuiz,

    // Student learning & exams
    reportVideoProgress,
    startExamAttempt,
    submitExamAttempt,
    getStudentExam,
    getStudentVideo,

    // Memos
    memosList,
    setMemosList,
    addMemo,
    updateMemo,
    deleteMemo,

    // Students
    addStudent,
    updateStudent,
    deleteStudent,
    createStudentByAdmin,
    updateStudentByAdmin,
    updateStudentByTeacher: updateStudent,
    deleteStudentByTeacher: deleteStudent,

    // Constants
    GRADES,
    TEACHER_CODES,
    TEACHER_INFO,
  };

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
};

export default StudentProvider;
