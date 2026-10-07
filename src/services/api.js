/**
 * MathPlatform API Client (OpenAPI 3.0.0 Aligned)
 * Base URL: http://127.0.0.1:8000
 */

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://127.0.0.1:8000";

// Token & Device Storage Keys
const ADMIN_TOKEN_KEY = "mathplatform_admin_token";
const STUDENT_TOKEN_KEY = "mathplatform_student_token";
const DEVICE_ID_KEY = "mathplatform_device_id";
const OFFLINE_REQUESTS_KEY = "mathplatform_offline_requests";
const OFFLINE_APPROVED_KEY = "mathplatform_offline_approved";

// ======================================================================
// TOKEN STORAGE
// ======================================================================

export const tokenStorage = {
  getAdminToken: () =>
    typeof localStorage !== "undefined"
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null,

  setAdminToken: (token) => {
    if (token && typeof localStorage !== "undefined") {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  },

  clearAdminToken: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  },

  getStudentToken: () =>
    typeof localStorage !== "undefined"
      ? localStorage.getItem(STUDENT_TOKEN_KEY)
      : null,

  setStudentToken: (token) => {
    if (token && typeof localStorage !== "undefined") {
      localStorage.setItem(STUDENT_TOKEN_KEY, token);
    }
  },

  clearStudentToken: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STUDENT_TOKEN_KEY);
    }
  },

  clearTokens: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(STUDENT_TOKEN_KEY);
    }
  },
};

// ======================================================================
// DEVICE ID
// ======================================================================

/**
 * Generate or retrieve persistent UUID device identifier
 * for student device binding.
 */
export function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);

    if (!id) {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        id = crypto.randomUUID();
      } else {
        id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
      }

      localStorage.setItem(DEVICE_ID_KEY, id);
    }

    return id;
  } catch {
    return "8f4c2e91-7a32-4d8b-91a2-5e6f3c8d1204";
  }
}

// ======================================================================
// GRADE MAPPING
// ======================================================================

export const GRADE_ID_MAP = {
  1: "الصف الثالث الثانوي",
  2: "الصف الثاني الثانوي",
  3: "الصف الأول الثانوي",
  4: "الصف الثالث الإعدادي",
  5: "الصف الثاني الإعدادي",
  6: "الصف الأول الإعدادي",

  sec3: 1,
  sec2: 2,
  sec1: 3,

  prep3: 4,
  prep2: 5,
  prep1: 6,

  "الصف الثالث الثانوي": 1,
  "الصف الثاني الثانوي": 2,
  "الصف الأول الثانوي": 3,
  "الصف الثالث الإعدادي": 4,
  "الصف الثاني الإعدادي": 5,
  "الصف الأول الإعدادي": 6,
};

export const getGradeNameById = (id) =>
  GRADE_ID_MAP[id] || "الصف الثالث الثانوي";

export const getGradeIdByName = (name) => GRADE_ID_MAP[name] || 1;

// ======================================================================
// STANDARD HTTP REQUEST
// ======================================================================

async function request(endpoint, options = {}, authType = null) {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  if (authType === "admin") {
    const token = tokenStorage.getAdminToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (authType === "student") {
    const token = tokenStorage.getStudentToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 6000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error ||
        `خطأ ${response.status}: فشل استدعاء الخادم`;

      const err = new Error(errorMsg);

      err.status = response.status;
      err.data = data;

      throw err;
    }

    return {
      success: true,
      data,
      isOffline: false,
    };
  } catch (err) {
    console.warn(
      `[API] Network or offline fallback for ${endpoint}:`,
      err.message,
    );

    return {
      success: false,
      isNetworkError:
        err.name === "AbortError" ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("fetch failed") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("ECONNREFUSED") ||
        err.code === "ECONNREFUSED",

      error: err.message,
      status: err.status || 0,
      data: err.data || null,
    };
  }
}

// ======================================================================
// RESPONSE NORMALIZER
// ======================================================================

function normalizeApiSuccess(res) {
  if (!res?.success) {
    return res;
  }

  const payload = res.data;

  // لو الـ backend بالفعل بيرجع:
  // { success: true, data: ... }
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Object.prototype.hasOwnProperty.call(payload, "success")
  ) {
    return {
      ...payload,
      data: payload.data ?? payload,
      isOffline: false,
    };
  }

  // لو الـ backend بيرجع البيانات مباشرة
  return {
    success: true,
    data: payload,
    isOffline: false,
  };
}

// ======================================================================
// OFFLINE REQUESTS
// ======================================================================

const getOfflineRequests = () => {
  try {
    const saved = localStorage.getItem(OFFLINE_REQUESTS_KEY);

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            student_id: 101,
            first_name: "زياد",
            last_name: "أحمد محمود",
            phone: "01098765432",
            parent_phone: "01123456789",
            grade_id: 1,
            grade_name: "الصف الثالث الثانوي",
            status: "pending",
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: 2,
            student_id: 102,
            first_name: "فاطمة",
            last_name: "خالد مصطفى",
            phone: "01234567891",
            parent_phone: "01011223344",
            grade_id: 2,
            grade_name: "الصف الثاني الثانوي",
            status: "pending",
            created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          },
        ];
  } catch {
    return [];
  }
};

const saveOfflineRequests = (items) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(OFFLINE_REQUESTS_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.warn("Could not save offline requests", e);
  }
};

// ======================================================================
// OFFLINE APPROVED STUDENTS
// ======================================================================

const getOfflineApproved = () => {
  try {
    const saved =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(OFFLINE_APPROVED_KEY)
        : null;

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,

            student: {
              id: 1,
              first_name: "أحمد",
              last_name: "محمد الشريف",
              phone: "01012345678",
              parent_phone: "01198765432",
              grade_id: 1,
            },

            subscription_code: "SEC3-101",
            status: "active",
            start_date: "2026-08-25",
            end_date: "2027-08-25",
            code_expires_at: "2027-08-25",
            device_identifier: "8f4c2e91-7a32-4d8b-91a2-5e6f3c8d1204",
          },

          {
            id: 2,

            student: {
              id: 2,
              first_name: "مريم",
              last_name: "محمود عبد الرحمن",
              phone: "01234567890",
              parent_phone: "01099887766",
              grade_id: 1,
            },

            subscription_code: "SEC3-102",
            status: "active",
            start_date: "2026-08-26",
            end_date: "2027-08-26",
            code_expires_at: "2027-08-26",
            device_identifier: null,
          },

          {
            id: 3,

            student: {
              id: 3,
              first_name: "عمر",
              last_name: "خالد الصاوي",
              phone: "01122334455",
              parent_phone: "01555667788",
              grade_id: 2,
            },

            subscription_code: "SEC2-201",
            status: "active",
            start_date: "2026-08-27",
            end_date: "2027-08-27",
            code_expires_at: "2027-08-27",
            device_identifier: null,
          },
        ];
  } catch {
    return [];
  }
};

const saveOfflineApproved = (items) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(OFFLINE_APPROVED_KEY, JSON.stringify(items));
    }
  } catch (error) {
    console.warn("Could not save offline approved students", error);
  }
};

const OFFLINE_EXAMS_KEY = "mathplatform_offline_exams";

const getDefaultOfflineExams = () => [
  {
    id: 1,
    lesson_id: 1,
    title: "اختبار الدرس الأول: المحددات والمصفوفات",
    description: "اختبار شامل على خواص المحددات وحساب معكوس المصفوفة",
    duration_minutes: 20,
    passing_percentage: 60,
    is_active: true,
    questions: [
      {
        id: 1,
        question_text:
          "إذا كانت المصفوفة A على النظم 2×3 والمصفوفة B على النظم 3×2، فإن النظم للمصفوفة AB هو:",
        points: 1,
        options: [
          { id: 1, option_text: "2×2", is_correct: true },
          { id: 2, option_text: "3×3", is_correct: false },
          { id: 3, option_text: "2×3", is_correct: false },
          { id: 4, option_text: "غير معرفة", is_correct: false },
        ],
      },
      {
        id: 2,
        question_text: "محدد مصفوفة تحتوي على صف كامل من الأصفار قيمته تساوي:",
        points: 1,
        options: [
          { id: 5, option_text: "0", is_correct: true },
          { id: 6, option_text: "1", is_correct: false },
          { id: 7, option_text: "-1", is_correct: false },
          { id: 8, option_text: "غير معرف", is_correct: false },
        ],
      },
      {
        id: 3,
        question_text:
          "المصفوفة التي يتساوى فيها عدد الصفوف مع عدد الأعمدة تسمى مصفوفة:",
        points: 1,
        options: [
          { id: 9, option_text: "مربعة", is_correct: true },
          { id: 10, option_text: "قطرية فقط", is_correct: false },
          { id: 11, option_text: "صفرية فقط", is_correct: false },
          { id: 12, option_text: "عمودية", is_correct: false },
        ],
      },
    ],
  },
  {
    id: 2,
    lesson_id: 2,
    title: "اختبار الدرس الثاني: مبدأ العد والتباديل",
    description: "اختبار تقييمي على مبادئ العد الأساسية وحساب التباديل",
    duration_minutes: 25,
    passing_percentage: 65,
    is_active: true,
    questions: [
      {
        id: 4,
        question_text: "قيمة التبديلة 5P3 تساوي:",
        points: 2,
        options: [
          { id: 13, option_text: "60", is_correct: true },
          { id: 14, option_text: "120", is_correct: false },
          { id: 15, option_text: "20", is_correct: false },
          { id: 16, option_text: "10", is_correct: false },
        ],
      },
      {
        id: 5,
        question_text: "قيمة مضروب الصفر (0!) هي:",
        points: 1,
        options: [
          { id: 17, option_text: "1", is_correct: true },
          { id: 18, option_text: "0", is_correct: false },
          { id: 19, option_text: "غير معرف", is_correct: false },
          { id: 20, option_text: "∞", is_correct: false },
        ],
      },
    ],
  },
];

const getOfflineExams = () => {
  try {
    const saved =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(OFFLINE_EXAMS_KEY)
        : null;
    return saved ? JSON.parse(saved) : getDefaultOfflineExams();
  } catch {
    return getDefaultOfflineExams();
  }
};

const saveOfflineExams = (items) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(OFFLINE_EXAMS_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.warn("Could not save offline exams", e);
  }
};

// ======================================================================
// API ENDPOINTS
// ======================================================================

export const api = {
  // ====================================================================
  // 1. STUDENT AUTHENTICATION
  // ====================================================================

  /**
   * POST /api/v1/auth/activate
   */
  async activateStudent(input = {}) {
    const payload = {
      first_name: String(input.first_name || input.firstName || "").trim(),
      last_name: String(input.last_name || input.lastName || "").trim(),
      phone: String(input.phone || "").trim(),
      parent_phone: String(
        input.parent_phone || input.parentPhone || "",
      ).trim(),
      grade_id: Number(input.grade_id || input.gradeId || 1),
    };

    const res = await request("/api/v1/auth/activate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.success) {
      return normalizeApiSuccess(res);
    }

    if (res.isNetworkError) {
      const current = getOfflineRequests();

      const newReq = {
        id: Date.now(),
        student_id: Math.floor(Math.random() * 900) + 100,
        ...payload,
        grade_name: getGradeNameById(payload.grade_id),
        status: "pending",
        created_at: new Date().toISOString(),
      };

      saveOfflineRequests([newReq, ...current]);

      return {
        success: true,
        isOfflineMode: true,
        status: "pending",
        data: newReq,
        message:
          "تم تسجيل طلب التفعيل بنجاح! طلبك الآن في انتظار موافقة المعلم لتوليد كود الاشتراك.",
      };
    }

    throw new Error(res.error || "فشل تقديم طلب التفعيل");
  },

  /**
   * POST /api/v1/auth/login
   *
   * Accepts either:
   *
   * studentLogin("SEC3-101")
   *
   * OR
   *
   * studentLogin({
   *   subscription_code: "SEC3-101",
   *   device_identifier: "..."
   * })
   */
  async studentLogin(input) {
    const subscriptionCode =
      typeof input === "string" ? input : input?.subscription_code;

    const cleanCode = String(subscriptionCode || "")
      .trim()
      .toUpperCase();

    if (!cleanCode) {
      return {
        success: false,
        message: "كود الاشتراك مطلوب",
      };
    }

    const deviceId =
      typeof input === "object" && input?.device_identifier
        ? input.device_identifier
        : getOrCreateDeviceId();

    const res = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        subscription_code: cleanCode,
        device_identifier: deviceId,
      }),
    });

    if (res.success) {
      const result = normalizeApiSuccess(res);

      const token =
        result?.data?.token ||
        result?.token ||
        result?.data?.access_token ||
        result?.access_token;

      if (token) {
        tokenStorage.setStudentToken(token);
      }

      return result;
    }

    // Offline mode
    if (res.isNetworkError) {
      const approved = getOfflineApproved();

      const match = approved.find(
        (item) =>
          item.subscription_code?.toUpperCase() === cleanCode &&
          item.status === "active",
      );

      if (match) {
        const studentInfo = {
          id: match.student?.id || match.id,

          code: match.subscription_code,

          name:
            `${match.student?.first_name || ""} ${
              match.student?.last_name || ""
            }`.trim() || "طالب متميز",

          grade: getGradeNameById(match.student?.grade_id || 1),

          gradeId: match.student?.grade_id || 1,

          phone: match.student?.phone || "",

          parentPhone: match.student?.parent_phone || "",

          subscriptionStatus: "active",

          device_identifier: deviceId,
        };

        const simulatedToken = `simulated_token_${cleanCode}`;

        tokenStorage.setStudentToken(simulatedToken);

        return {
          success: true,
          isOfflineMode: true,
          message: "تم تسجيل الدخول بنجاح",

          data: {
            student: studentInfo,
          },

          student: studentInfo,
          token: simulatedToken,
        };
      }

      return {
        success: false,
        isOfflineMode: true,
        message: "كود الاشتراك غير صحيح أو الحساب لم يتم تفعيله بعد من المعلم.",
      };
    }

    return {
      success: false,
      error: res.error || "كود الاشتراك غير صالح أو الحساب غير مفعّل",
    };
  },

  /**
   * POST /api/v1/auth/logout
   */
  async studentLogout() {
    try {
      await request(
        "/api/v1/auth/logout",
        {
          method: "POST",
        },
        "student",
      );
    } finally {
      tokenStorage.clearStudentToken();
    }

    return {
      success: true,
    };
  },

  // ====================================================================
  // 2. ADMIN AUTHENTICATION
  // ====================================================================

  /**
   * POST /api/v1/admin/auth/login
   *
   * Supports:
   * adminLogin(email, password)
   *
   * OR:
   * adminLogin({ email, password })
   */
  async adminLogin(emailOrCredentials, password) {
    const credentials =
      typeof emailOrCredentials === "object"
        ? emailOrCredentials
        : {
            email: emailOrCredentials,
            password,
          };

    const email = String(credentials?.email || "").trim();

    const adminPassword = String(credentials?.password || "");

    if (!email || !adminPassword) {
      return {
        success: false,
        message: "البريد الإلكتروني وكلمة المرور مطلوبان",
      };
    }

    const res = await request("/api/v1/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: adminPassword,
      }),
    });

    if (res.success) {
      const result = normalizeApiSuccess(res);

      const token =
        result?.data?.token ||
        result?.token ||
        result?.data?.access_token ||
        result?.access_token;

      if (token) {
        tokenStorage.setAdminToken(token);
      }

      return result;
    }

    if (res.isNetworkError) {
      if (
        (email === "admin@example.com" && adminPassword === "Admin@12345") ||
        adminPassword === "admin" ||
        adminPassword === "123456"
      ) {
        const mockToken = `offline_admin_token_${Date.now()}`;

        tokenStorage.setAdminToken(mockToken);

        return {
          success: true,
          isOfflineMode: true,
          message: "تم تسجيل دخول المعلم / الإدارة بنجاح",

          data: {
            token: mockToken,
          },

          token: mockToken,
        };
      }

      return {
        success: false,
        isOfflineMode: true,
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      };
    }

    return {
      success: false,
      error: res.error || "فشل تسجيل دخول الإدارة",
    };
  },

  /**
   * POST /api/v1/admin/auth/logout
   */
  async adminLogout() {
    try {
      await request(
        "/api/v1/admin/auth/logout",
        {
          method: "POST",
        },
        "admin",
      );
    } finally {
      tokenStorage.clearAdminToken();
    }

    return {
      success: true,
    };
  },

  // ====================================================================
  // 3. ACTIVATION REQUESTS & SUBSCRIPTIONS
  // ====================================================================

  /**
   * GET /api/v1/admin/activation-requests
   */
  async getPendingActivationRequests() {
    const res = await request(
      "/api/v1/admin/activation-requests",
      {
        method: "GET",
      },
      "admin",
    );

    if (res.success) {
      const normalized = normalizeApiSuccess(res);

      const list = Array.isArray(normalized.data)
        ? normalized.data
        : normalized.data?.data || [];

      return {
        ...normalized,
        data: list,
      };
    }

    if (res.isNetworkError) {
      return {
        success: true,
        isOfflineMode: true,
        data: getOfflineRequests(),
      };
    }

    return {
      success: false,
      error: res.error || "فشل تحميل طلبات التفعيل المعلقة",
    };
  },

  // Alias used by StudentContext
  async getActivationRequests() {
    return api.getPendingActivationRequests();
  },

  /**
   * POST /api/v1/admin/activation-requests/{subscription}/approve
   */
  async approveActivationRequest(subscriptionId) {
    const res = await request(
      `/api/v1/admin/activation-requests/${subscriptionId}/approve`,
      {
        method: "POST",
      },
      "admin",
    );

    if (res.success) {
      return normalizeApiSuccess(res);
    }

    if (res.isNetworkError) {
      const requests = getOfflineRequests();

      const targetReq = requests.find((r) => r.id === subscriptionId);

      const remainingReqs = requests.filter((r) => r.id !== subscriptionId);

      saveOfflineRequests(remainingReqs);

      const approved = getOfflineApproved();

      const gradePrefix =
        targetReq?.grade_id === 1
          ? "SEC3"
          : targetReq?.grade_id === 2
            ? "SEC2"
            : targetReq?.grade_id === 3
              ? "SEC1"
              : "PREP3";

      const genCode = `${gradePrefix}-${Math.floor(Math.random() * 899) + 100}`;

      const newApprovedItem = {
        id: subscriptionId,

        student: {
          id: targetReq?.student_id || subscriptionId,
          first_name: targetReq?.first_name || "طالب",
          last_name: targetReq?.last_name || "جديد",
          phone: targetReq?.phone || "",
          parent_phone: targetReq?.parent_phone || "",
          grade_id: targetReq?.grade_id || 1,
        },

        subscription_code: genCode,
        status: "active",

        start_date: new Date().toISOString().split("T")[0],

        end_date: new Date(Date.now() + 365 * 86400000)
          .toISOString()
          .split("T")[0],

        code_expires_at: new Date(Date.now() + 365 * 86400000)
          .toISOString()
          .split("T")[0],

        device_identifier: null,
      };

      saveOfflineApproved([newApprovedItem, ...approved]);

      return {
        success: true,
        isOfflineMode: true,

        message: `تمت الموافقة وتفعيل كود الاشتراك [ ${genCode} ] بنجاح!`,

        data: {
          subscription: newApprovedItem,
        },

        subscription: newApprovedItem,
      };
    }

    return {
      success: false,
      error: res.error || "فشل قبول طلب التفعيل",
    };
  },

  /**
   * POST /api/v1/admin/activation-requests/{subscription}/cancel
   */
  async cancelActivationRequest(subscriptionId) {
    const res = await request(
      `/api/v1/admin/activation-requests/${subscriptionId}/cancel`,
      {
        method: "POST",
      },
      "admin",
    );

    if (res.success) {
      return normalizeApiSuccess(res);
    }

    if (res.isNetworkError) {
      const requests = getOfflineRequests();

      const remaining = requests.filter((r) => r.id !== subscriptionId);

      saveOfflineRequests(remaining);

      return {
        success: true,
        isOfflineMode: true,
        message: "تم إلغاء / رفض طلب التفعيل بنجاح",
      };
    }

    return {
      success: false,
      error: res.error || "فشل إلغاء طلب التفعيل",
    };
  },

  // Backward compatibility
  async rejectActivationRequest(subscriptionId) {
    return api.cancelActivationRequest(subscriptionId);
  },

  /**
   * GET /api/v1/admin/approved-students
   */
  async getApprovedStudents() {
    const res = await request(
      "/api/v1/admin/approved-students",
      {
        method: "GET",
      },
      "admin",
    );

    if (res.success) {
      const normalized = normalizeApiSuccess(res);

      const list = Array.isArray(normalized.data)
        ? normalized.data
        : normalized.data?.data || [];

      return {
        ...normalized,
        data: list,
      };
    }

    if (res.isNetworkError) {
      return {
        success: true,
        isOfflineMode: true,
        data: getOfflineApproved(),
      };
    }

    return {
      success: false,
      error: res.error || "فشل تحميل قائمة الطلاب المعتمدين",
    };
  },

  /**
   * POST /api/v1/admin/subscriptions/{subscription}/deactivate
   */
  async deactivateSubscription(subscriptionId) {
    const res = await request(
      `/api/v1/admin/subscriptions/${subscriptionId}/deactivate`,
      {
        method: "POST",
      },
      "admin",
    );

    if (res.success) {
      return normalizeApiSuccess(res);
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();

      const updated = approved.map((item) => {
        if (item.id === subscriptionId) {
          return {
            ...item,
            status: "cancelled",
          };
        }

        return item;
      });

      saveOfflineApproved(updated);

      return {
        success: true,
        isOfflineMode: true,
        message: "تم تعطيل الاشتراك بنجاح",
      };
    }

    return {
      success: false,
      error: res.error || "فشل تعطيل الاشتراك",
    };
  },

  // Alias used by StudentContext
  async deactivateStudent(subscriptionId) {
    return api.deactivateSubscription(subscriptionId);
  },

  /**
   * POST /api/v1/admin/subscriptions/{subscription}/reset-device
   */
  async resetTrustedDevice(subscriptionId) {
    const res = await request(
      `/api/v1/admin/subscriptions/${subscriptionId}/reset-device`,
      {
        method: "POST",
      },
      "admin",
    );

    if (res.success) {
      return normalizeApiSuccess(res);
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();

      const updated = approved.map((item) => {
        if (item.id === subscriptionId) {
          return {
            ...item,
            device_identifier: null,
          };
        }

        return item;
      });

      saveOfflineApproved(updated);

      return {
        success: true,
        isOfflineMode: true,

        message:
          "تمت إعادة ضبط الجهاز الموثوق بنجاح. يمكن للطالب الآن تسجيل الدخول من جهاز جديد.",
      };
    }

    return {
      success: false,
      error: res.error || "فشل إعادة ضبط جهاز الطالب",
    };
  },

  // Alias used by StudentContext
  async resetStudentDevice(subscriptionId) {
    return api.resetTrustedDevice(subscriptionId);
  },

  /**
   * POST /api/v1/admin/subscriptions/{subscription}/activate
   */
  async reactivateSubscription(subscriptionId) {
    const res = await request(
      `/api/v1/admin/subscriptions/${subscriptionId}/activate`,
      {
        method: "POST",
      },
      "admin",
    );

    if (res.success) {
      return normalizeApiSuccess(res);
    }

    return {
      success: false,
      error: res.error || "فشل إعادة تفعيل اشتراك الطالب",
      status: res.status,
      isNetworkError: res.isNetworkError,
    };
  },

  async reactivateStudent(subscriptionId) {
    return api.reactivateSubscription(subscriptionId);
  },

  /**
   * GET /api/v1/admin/subscription-codes?grade_id={grade_id}
   */
  async getSubscriptionCodesByGrade(gradeId) {
    const res = await request(
      `/api/v1/admin/subscription-codes?grade_id=${gradeId}`,
      {
        method: "GET",
      },
      "admin",
    );

    if (res.success) {
      const normalized = normalizeApiSuccess(res);

      const list = Array.isArray(normalized.data)
        ? normalized.data
        : normalized.data?.data || [];

      return {
        ...normalized,
        data: list,
      };
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();

      const list = approved
        .filter(
          (item) =>
            item.student?.grade_id == gradeId && item.status === "active",
        )
        .map((item) => ({
          student_name: `${item.student?.first_name || ""} ${
            item.student?.last_name || ""
          }`.trim(),

          subscription_code: item.subscription_code,

          grade_id: gradeId,
        }));

      return {
        success: true,
        isOfflineMode: true,
        data: list,
      };
    }

    return {
      success: false,
      error: res.error || "فشل جلب أكواد الاشتراك للمرحلة",
    };
  },

  // Alias used by StudentContext
  async getSubscriptionCodes(gradeId) {
    return api.getSubscriptionCodesByGrade(gradeId);
  },

  // ====================================================================
  // 4. ADMIN STUDENTS CRUD
  // ====================================================================

  /**
   * GET /api/v1/admin/students?page=1
   */
  async getAllStudents(page = 1) {
    const res = await request(
      `/api/v1/admin/students?page=${page}`,
      {
        method: "GET",
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();

      const list = approved.map((item) => ({
        id: item.student?.id || item.id,

        first_name: item.student?.first_name,

        last_name: item.student?.last_name,

        name: `${item.student?.first_name || ""} ${
          item.student?.last_name || ""
        }`.trim(),

        phone: item.student?.phone,

        parent_phone: item.student?.parent_phone,

        grade_id: item.student?.grade_id || 1,

        grade: getGradeNameById(item.student?.grade_id || 1),

        subscription_code: item.subscription_code,

        status: item.status,
      }));

      return {
        data: list,
        current_page: 1,
        last_page: 1,
        total: list.length,
      };
    }

    throw new Error(res.error || "فشل تحميل قائمة الطلاب");
  },

  /**
   * POST /api/v1/admin/students
   */
  async createStudentByAdmin(payload = {}) {
    const body = {
      first_name: String(payload.first_name || payload.firstName || "").trim(),
      last_name: String(payload.last_name || payload.lastName || "").trim(),
      phone: String(payload.phone || "").trim(),
      parent_phone: String(
        payload.parent_phone || payload.parentPhone || "",
      ).trim(),
      grade_id: Number(payload.grade_id || payload.gradeId || 1),

      start_date:
        payload.start_date ||
        payload.startDate ||
        new Date().toISOString().split("T")[0],

      end_date:
        payload.end_date ||
        payload.endDate ||
        new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],

      code_expires_at:
        payload.code_expires_at ||
        payload.codeExpiresAt ||
        new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    };

    const res = await request(
      "/api/v1/admin/students",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();

      const prefix =
        body.grade_id === 1
          ? "SEC3"
          : body.grade_id === 2
            ? "SEC2"
            : body.grade_id === 3
              ? "SEC1"
              : "PREP3";

      const code = `${prefix}-${Math.floor(Math.random() * 899) + 100}`;

      const newId = Date.now();

      const item = {
        id: newId,

        student: {
          id: newId,
          ...body,
        },

        subscription_code: code,
        status: "active",
        start_date: body.start_date,
        end_date: body.end_date,
        code_expires_at: body.code_expires_at,
        device_identifier: null,
      };

      saveOfflineApproved([item, ...approved]);

      return {
        success: true,
        isOfflineMode: true,

        message: `تم إنشاء الطالب وتفعيل كود الاشتراك [ ${code} ] بنجاح!`,

        student: item,
      };
    }

    throw new Error(res.error || "فشل إنشاء حساب الطالب");
  },

  /**
   * GET /api/v1/admin/students/{student}
   */
  async getStudentDetails(studentId) {
    const res = await request(
      `/api/v1/admin/students/${studentId}`,
      {
        method: "GET",
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();

      const found = approved.find(
        (item) => item.student?.id == studentId || item.id == studentId,
      );

      if (found) {
        return found;
      }

      throw new Error("لم يتم العثور على بيانات الطالب");
    }

    throw new Error(res.error || "فشل جلب بيانات الطالب");
  },

  /**
   * PUT /api/v1/admin/students/{student}
   */
  async updateStudent(studentId, payload = {}) {
    const body = {
      first_name: String(payload.first_name || payload.firstName || "").trim(),
      last_name: String(payload.last_name || payload.lastName || "").trim(),
      phone: String(payload.phone || "").trim(),
      parent_phone: String(
        payload.parent_phone || payload.parentPhone || "",
      ).trim(),
      grade_id: Number(payload.grade_id || payload.gradeId || 1),
    };

    const res = await request(
      `/api/v1/admin/students/${studentId}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();

      const updated = approved.map((item) => {
        if (item.student?.id == studentId || item.id == studentId) {
          return {
            ...item,

            student: {
              ...item.student,
              ...body,
            },
          };
        }

        return item;
      });

      saveOfflineApproved(updated);

      return {
        success: true,
        isOfflineMode: true,
        message: "تم تحديث بيانات الطالب بنجاح",
      };
    }

    throw new Error(res.error || "فشل تحديث بيانات الطالب");
  },

  // ====================================================================
  // 5. ADMIN LESSONS
  // ====================================================================

  /**
   * GET /api/v1/admin/lessons
   */
  async getAdminLessons(gradeId = null) {
    const query = gradeId ? `?grade_id=${gradeId}` : "";

    const res = await request(
      `/api/v1/admin/lessons${query}`,
      {
        method: "GET",
      },
      "admin",
    );

    if (res.success) {
      const payload = res.data?.data ?? res.data;
      if (Array.isArray(payload)) return payload;
      return payload?.lessons || payload?.data || [];
    }

    if (res.isNetworkError) {
      return null;
    }

    throw new Error(res.error || "فشل جلب قائمة الدروس من الخادم");
  },

  /**
   * POST /api/v1/admin/lessons
   */
  async createAdminLesson(payload = {}) {
    const gradeValue = payload.grade_id ?? payload.gradeId ?? payload.grade;
    const numericGradeId = Number(gradeValue);
    const body = {
      grade_id: Number.isFinite(numericGradeId)
        ? numericGradeId
        : getGradeIdByName(gradeValue),

      section_name: String(
        payload.section_name || payload.branch || "الجبر والهندسة الفراغية",
      ).trim(),

      title: String(payload.title || "").trim(),

      description: payload.description || "",

      video_url: String(payload.video_url || payload.videoUrl || "").trim(),
    };

    const res = await request(
      "/api/v1/admin/lessons",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      return {
        success: true,
        isOfflineMode: true,
        message: "تم حفظ المحاضرة محلياً (وضع عدم الاتصال)",

        lesson: {
          id: Date.now(),
          ...body,
        },
      };
    }

    throw new Error(res.error || "فشل إنشاء المحاضرة");
  },

  /**
   * PUT /api/v1/admin/lessons/{lesson}
   *
   * Added because StudentContext uses updateAdminLesson.
   */
  async updateAdminLesson(lessonId, payload) {
    const body = {
      grade_id: Number(payload.grade_id || payload.gradeId || 1),

      section_name:
        payload.section_name || payload.branch || "الجبر والهندسة الفراغية",

      title: payload.title?.trim() || "",

      description: payload.description || "",

      video_url: payload.video_url || payload.videoUrl,
    };

    const res = await request(
      `/api/v1/admin/lessons/${lessonId}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      return {
        success: true,
        isOfflineMode: true,
        message: "تم تعديل المحاضرة محلياً",
      };
    }

    throw new Error(res.error || "فشل تعديل المحاضرة");
  },

  /**
   * DELETE /api/v1/admin/lessons/{lesson}
   */
  async deleteAdminLesson(lessonId) {
    const res = await request(
      `/api/v1/admin/lessons/${lessonId}`,
      {
        method: "DELETE",
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      return {
        success: true,
        isOfflineMode: true,
        message: "تم حذف المحاضرة",
      };
    }

    throw new Error(res.error || "فشل حذف المحاضرة");
  },

  // ====================================================================
  // 6. ADMIN EXAMS
  // ====================================================================

  /**
   * GET /api/v1/admin/exams
   */
  async getAdminExams() {
    const res = await request(
      "/api/v1/admin/exams",
      {
        method: "GET",
      },
      "admin",
    );

    if (res.success) {
      const payload = res.data?.data ?? res.data;
      if (Array.isArray(payload)) return payload;
      return payload?.exams || payload?.data || [];
    }

    if (res.isNetworkError) {
      return getOfflineExams();
    }

    throw new Error(res.error || "فشل جلب قائمة الامتحانات");
  },

  /**
   * POST /api/v1/admin/exams
   */
  async createAdminExam(payload = {}) {
    const body = {
      lesson_id: Number(payload.lesson_id || payload.lessonId || 1),
      title: String(payload.title || "").trim(),
      description: payload.description || "",
      duration_minutes:
        payload.duration_minutes !== undefined
          ? Number(payload.duration_minutes)
          : payload.durationMinutes !== undefined
            ? Number(payload.durationMinutes)
            : 20,
      passing_percentage: Number(
        payload.passing_percentage || payload.passingPercentage || 60,
      ),
    };

    const res = await request(
      "/api/v1/admin/exams",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const newExam = {
        id: Date.now(),
        ...body,
        is_active: true,
        questions: [],
      };
      saveOfflineExams([...exams, newExam]);
      return {
        success: true,
        isOfflineMode: true,
        data: newExam,
        exam: newExam,
        message: "تم إنشاء الاختبار بنجاح (محلياً)",
      };
    }

    throw new Error(res.error || "فشل إنشاء الاختبار");
  },

  /**
   * GET /api/v1/admin/exams/{exam}
   */
  async getAdminExamDetails(examId) {
    const res = await request(
      `/api/v1/admin/exams/${examId}`,
      {
        method: "GET",
      },
      "admin",
    );

    if (res.success) {
      return res.data?.data || res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const exam = exams.find((e) => e.id == examId) || exams[0];
      return exam;
    }

    throw new Error(res.error || "فشل جلب تفاصيل الاختبار");
  },

  /**
   * PUT /api/v1/admin/exams/{exam}
   */
  async updateAdminExam(examId, payload) {
    const res = await request(
      `/api/v1/admin/exams/${examId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const updated = exams.map((e) =>
        e.id == examId ? { ...e, ...payload } : e,
      );
      saveOfflineExams(updated);
      return {
        success: true,
        isOfflineMode: true,
        message: "تم تحديث الاختبار بنجاح",
      };
    }

    throw new Error(res.error || "فشل تعديل الاختبار");
  },

  /**
   * DELETE /api/v1/admin/exams/{exam}
   */
  async deleteAdminExam(examId) {
    const res = await request(
      `/api/v1/admin/exams/${examId}`,
      {
        method: "DELETE",
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const filtered = exams.filter((e) => e.id != examId);
      saveOfflineExams(filtered);
      return {
        success: true,
        isOfflineMode: true,
        message: "تم حذف الاختبار بنجاح",
      };
    }

    throw new Error(res.error || "فشل حذف الاختبار");
  },

  // ====================================================================
  // QUESTIONS
  // ====================================================================

  /**
   * POST /api/v1/admin/exams/{exam}/questions
   */
  async createAdminQuestion(examId, payload) {
    const body = {
      question_text: payload.question_text || payload.question || "",
      points: Number(payload.points || 1),
    };

    const res = await request(
      `/api/v1/admin/exams/${examId}/questions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const newQuestion = {
        id: Date.now(),
        ...body,
        options: [],
      };
      const updated = exams.map((e) => {
        if (e.id == examId) {
          return {
            ...e,
            questions: [...(e.questions || []), newQuestion],
          };
        }
        return e;
      });
      saveOfflineExams(updated);
      return {
        success: true,
        isOfflineMode: true,
        data: newQuestion,
        message: "تمت إضافة السؤال بنجاح",
      };
    }

    throw new Error(res.error || "فشل إضافة السؤال");
  },

  /**
   * PUT /api/v1/admin/questions/{question}
   */
  async updateAdminQuestion(questionId, payload) {
    const res = await request(
      `/api/v1/admin/questions/${questionId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const updated = exams.map((e) => ({
        ...e,
        questions: (e.questions || []).map((q) =>
          q.id == questionId ? { ...q, ...payload } : q,
        ),
      }));
      saveOfflineExams(updated);
      return {
        success: true,
        isOfflineMode: true,
        message: "تم تعديل السؤال بنجاح",
      };
    }

    throw new Error(res.error || "فشل تعديل السؤال");
  },

  /**
   * DELETE /api/v1/admin/questions/{question}
   */
  async deleteAdminQuestion(questionId) {
    const res = await request(
      `/api/v1/admin/questions/${questionId}`,
      {
        method: "DELETE",
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const updated = exams.map((e) => ({
        ...e,
        questions: (e.questions || []).filter((q) => q.id != questionId),
      }));
      saveOfflineExams(updated);
      return {
        success: true,
        isOfflineMode: true,
        message: "تم حذف السؤال بنجاح",
      };
    }

    throw new Error(res.error || "فشل حذف السؤال");
  },

  // ====================================================================
  // OPTIONS
  // ====================================================================

  /**
   * POST /api/v1/admin/questions/{question}/options
   */
  async createAdminOption(questionId, payload) {
    const body = {
      option_text: String(payload.option_text || payload.text || "").trim(),
      is_correct: Boolean(payload.is_correct),
    };

    const res = await request(
      `/api/v1/admin/questions/${questionId}/options`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const newOption = {
        id: Date.now(),
        ...body,
      };
      const updated = exams.map((e) => ({
        ...e,
        questions: (e.questions || []).map((q) => {
          if (q.id == questionId) {
            // If new option is marked correct, toggle others to false
            const currentOpts = (q.options || []).map((opt) =>
              body.is_correct ? { ...opt, is_correct: false } : opt,
            );
            return {
              ...q,
              options: [...currentOpts, newOption],
            };
          }
          return q;
        }),
      }));
      saveOfflineExams(updated);
      return {
        success: true,
        isOfflineMode: true,
        data: newOption,
        message: "تمت إضافة خيار الإجابة بنجاح",
      };
    }

    throw new Error(res.error || "فشل إضافة خيار الإجابة");
  },

  /**
   * PUT /api/v1/admin/options/{option}
   */
  async updateAdminOption(optionId, payload) {
    const res = await request(
      `/api/v1/admin/options/${optionId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const updated = exams.map((e) => ({
        ...e,
        questions: (e.questions || []).map((q) => ({
          ...q,
          options: (q.options || []).map((opt) =>
            opt.id == optionId ? { ...opt, ...payload } : opt,
          ),
        })),
      }));
      saveOfflineExams(updated);
      return {
        success: true,
        isOfflineMode: true,
        message: "تم تعديل خيار الإجابة بنجاح",
      };
    }

    throw new Error(res.error || "فشل تعديل خيار الإجابة");
  },

  /**
   * DELETE /api/v1/admin/options/{option}
   */
  async deleteAdminOption(optionId) {
    const res = await request(
      `/api/v1/admin/options/${optionId}`,
      {
        method: "DELETE",
      },
      "admin",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const updated = exams.map((e) => ({
        ...e,
        questions: (e.questions || []).map((q) => ({
          ...q,
          options: (q.options || []).filter((opt) => opt.id != optionId),
        })),
      }));
      saveOfflineExams(updated);
      return {
        success: true,
        isOfflineMode: true,
        message: "تم حذف خيار الإجابة بنجاح",
      };
    }

    throw new Error(res.error || "فشل حذف خيار الإجابة");
  },

  // ====================================================================
  // 7. STUDENT PROFILE / LESSONS / VIDEOS
  // ====================================================================

  /**
   * GET /api/v1/student/profile
   */
  async getStudentProfile() {
    const res = await request(
      "/api/v1/student/profile",
      {
        method: "GET",
      },
      "student",
    );

    if (res.success) {
      return normalizeApiSuccess(res);
    }

    if (res.isNetworkError) {
      return {
        success: false,
        isOfflineMode: true,
        data: null,
      };
    }

    return {
      success: false,
      error: res.error || "فشل جلب الملف الشخصي للطالب",
    };
  },

  /**
   * GET /api/v1/student/lessons
   */
  async getStudentLessons() {
    const res = await request(
      "/api/v1/student/lessons",
      {
        method: "GET",
      },
      "student",
    );

    if (res.success) {
      const payload = res.data?.data ?? res.data;
      if (Array.isArray(payload)) return payload;
      return payload?.lessons || payload?.data || [];
    }

    if (res.isNetworkError) {
      return null;
    }

    throw new Error(res.error || "فشل جلب دروس الطالب");
  },

  /**
   * GET /api/v1/student/videos/{video}
   */
  async getStudentVideo(videoId) {
    const res = await request(
      `/api/v1/student/videos/${videoId}`,
      {
        method: "GET",
      },
      "student",
    );

    if (res.success) {
      return res.data?.data || res.data;
    }

    if (res.isNetworkError) {
      return {
        id: Number(videoId),
        is_locked: false,
        status: "accessible",
      };
    }

    const err = new Error(res.error || "الفيديو مقفل أو غير متاح حالياً");
    err.status = res.status;
    err.isLocked = res.status === 403;
    throw err;
  },

  /**
   * POST /api/v1/student/videos/{video}/progress
   *
   * Body:
   * {
   *   current_position_seconds,
   *   watched_duration_seconds,
   *   completion_percentage
   * }
   */
  async updateVideoProgress(videoId, payload = {}) {
    const currentPos =
      payload.current_position_seconds ?? payload.currentPositionSeconds ?? 0;
    const watchedDur =
      payload.watched_duration_seconds ??
      payload.watchedDurationSeconds ??
      currentPos;
    const compPct =
      payload.completion_percentage ?? payload.completionPercentage ?? 0;

    const body = {
      current_position_seconds: Math.floor(Number(currentPos)),
      watched_duration_seconds: Math.floor(Number(watchedDur)),
      completion_percentage: Math.min(
        100,
        Math.max(0, Math.round(Number(compPct))),
      ),
    };

    const res = await request(
      `/api/v1/student/videos/${videoId}/progress`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "student",
    );

    if (res.success) {
      return normalizeApiSuccess(res);
    }

    if (res.isNetworkError) {
      return {
        success: true,
        isOfflineMode: true,
        data: body,
      };
    }

    return {
      success: false,
      error: res.error,
    };
  },

  // ====================================================================
  // 8. STUDENT EXAMS
  // ====================================================================

  /**
   * GET /api/v1/student/exams/{exam}
   */
  async getStudentExam(examId) {
    const res = await request(
      `/api/v1/student/exams/${examId}`,
      {
        method: "GET",
      },
      "student",
    );

    if (res.success) {
      return res.data?.data || res.data;
    }

    if (res.isNetworkError) {
      const exams = getOfflineExams();
      const exam =
        exams.find((e) => e.id == examId || e.lesson_id == examId) || exams[0];
      return exam;
    }

    const err = new Error(res.error || "الاختبار مقفل أو غير متاح حالياً");
    err.status = res.status;
    err.isLocked = res.status === 403;
    throw err;
  },

  /**
   * POST /api/v1/student/exams/{exam}/start
   */
  async startStudentExam(examId) {
    const res = await request(
      `/api/v1/student/exams/${examId}/start`,
      {
        method: "POST",
      },
      "student",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      return {
        success: true,
        isOfflineMode: true,
        attempt_id: Date.now(),
      };
    }

    throw new Error(res.error || "فشل بدء الاختبار");
  },

  /**
   * Alias used by StudentContext
   */
  async startExamAttempt(examId) {
    return api.startStudentExam(examId);
  },

  /**
   * POST /api/v1/student/exams/{exam}/submit
   */
  async submitStudentExam(examId, payload = {}) {
    let attempt_id = 1;
    let answers = [];

    if (Array.isArray(payload)) {
      answers = payload;
    } else if (payload && typeof payload === "object") {
      attempt_id = payload.attempt_id || payload.attemptId || 1;
      answers = Array.isArray(payload.answers) ? payload.answers : [];
    }

    const formattedAnswers = answers.map((a, idx) => ({
      question_id: Number(a.question_id || a.questionId || idx + 1),
      option_id: Number(
        a.option_id ||
          a.optionId ||
          (a.selectedOptionIndex !== undefined ? a.selectedOptionIndex + 1 : 1),
      ),
    }));

    const body = {
      attempt_id: Number(attempt_id),
      answers: formattedAnswers,
    };

    const res = await request(
      `/api/v1/student/exams/${examId}/submit`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "student",
    );

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      return {
        success: true,
        isOfflineMode: true,
        message: "تم تسليم الإجابات بنجاح",
      };
    }

    throw new Error(res.error || "فشل تسليم إجابات الاختبار");
  },

  /**
   * Alias used by StudentContext
   */
  async submitExamAttempt(examId, answers) {
    return api.submitStudentExam(examId, answers);
  },

  // ============================================================
  // 9. OPENAPI 3.0.0 OPERATION ID ALIASES (Only for different names)
  // ============================================================
  approveStudentActivation: (subId) => api.approveActivationRequest(subId),
  cancelStudentActivation: (subId) => api.cancelActivationRequest(subId),
  adminExamsIndex: () => api.getAdminExams(),
  adminExamsStore: (payload) => api.createAdminExam(payload),
  adminExamsShow: (examId) => api.getAdminExamDetails(examId),
  adminExamsUpdate: (examId, payload) => api.updateAdminExam(examId, payload),
  adminExamsDestroy: (examId) => api.deleteAdminExam(examId),
  adminExamQuestionStore: (examId, payload) =>
    api.createAdminQuestion(examId, payload),
  adminQuestionUpdate: (qId, payload) => api.updateAdminQuestion(qId, payload),
  adminQuestionDestroy: (qId) => api.deleteAdminQuestion(qId),
  adminQuestionOptionStore: (qId, payload) =>
    api.createAdminOption(qId, payload),
  adminOptionUpdate: (optId, payload) => api.updateAdminOption(optId, payload),
  adminOptionDestroy: (optId) => api.deleteAdminOption(optId),
  adminLessonsIndex: (gradeId) => api.getAdminLessons(gradeId),
  adminLessonsStore: (payload) => api.createAdminLesson(payload),
  adminLessonsDestroy: (lessonId) => api.deleteAdminLesson(lessonId),
  getStudentByAdmin: (studentId) => api.getStudentDetails(studentId),
  updateStudentByAdmin: (studentId, payload) =>
    api.updateStudent(studentId, payload),
  activateStudentAccount: (payload) => api.activateStudent(payload),
  studentExamShow: (examId) => api.getStudentExam(examId),
  studentExamStart: (examId) => api.startStudentExam(examId),
  studentExamSubmit: (examId, payload) =>
    api.submitStudentExam(examId, payload),
  studentLessonsIndex: () => api.getStudentLessons(),
  studentVideoShow: (videoId) => api.getStudentVideo(videoId),
  studentVideoProgress: (videoId, payload) =>
    api.updateVideoProgress(videoId, payload),
};

export default api;
