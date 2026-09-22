/**
 * MathPlatform API Client (OpenAPI 3.0.0)
 * Base URL: http://127.0.0.1:8000
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Token Storage Keys
const ADMIN_TOKEN_KEY = 'mathplatform_admin_token';
const STUDENT_TOKEN_KEY = 'mathplatform_student_token';
const OFFLINE_REQUESTS_KEY = 'mathplatform_offline_requests';
const OFFLINE_APPROVED_KEY = 'mathplatform_offline_approved';

export const tokenStorage = {
  getAdminToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  setAdminToken: (token) => {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  },
  getStudentToken: () => localStorage.getItem(STUDENT_TOKEN_KEY),
  setStudentToken: (token) => {
    if (token) localStorage.setItem(STUDENT_TOKEN_KEY, token);
    else localStorage.removeItem(STUDENT_TOKEN_KEY);
  },
  clearTokens: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(STUDENT_TOKEN_KEY);
  }
};

/**
 * Grade ID mapping helper:
 * 1 -> الصف الثالث الثانوي
 * 2 -> الصف الثاني الثانوي
 * 3 -> الصف الأول الثانوي
 * 4 -> الصف الثالث الإعدادي
 */
export const GRADE_ID_MAP = {
  1: 'الصف الثالث الثانوي',
  2: 'الصف الثاني الثانوي',
  3: 'الصف الأول الثانوي',
  4: 'الصف الثالث الإعدادي',
  5: 'الصف الثاني الإعدادي',
  6: 'الصف الأول الإعدادي',
  'sec3': 1,
  'sec2': 2,
  'sec1': 3,
  'prep3': 4,
  'prep2': 5,
  'prep1': 6,
  'الصف الثالث الثانوي': 1,
  'الصف الثاني الثانوي': 2,
  'الصف الأول الثانوي': 3,
  'الصف الثالث الإعدادي': 4,
  'الصف الثاني الإعدادي': 5,
  'الصف الأول الإعدادي': 6,
};

export const getGradeNameById = (id) => GRADE_ID_MAP[id] || 'الصف الثالث الثانوي';
export const getGradeIdByName = (name) => GRADE_ID_MAP[name] || 1;

/**
 * Standard HTTP Request Wrapper
 */
async function request(endpoint, options = {}, authType = null) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  if (authType === 'admin') {
    const token = tokenStorage.getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else if (authType === 'student') {
    const token = tokenStorage.getStudentToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `خطأ ${response.status}: فشل استدعاء الخادم`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return { success: true, data, isOffline: false };
  } catch (err) {
    // Network error or offline
    console.warn(`[API] Fallback/Offline for ${endpoint}:`, err.message);
    return {
      success: false,
      isNetworkError: err.name === 'AbortError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError'),
      error: err.message,
      status: err.status || 0,
      data: err.data || null
    };
  }
}

/**
 * Mock/Fallback Store for seamless local testing when backend server isn't actively running
 */
const getOfflineRequests = () => {
  try {
    const saved = localStorage.getItem(OFFLINE_REQUESTS_KEY);
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        student_id: 101,
        first_name: 'زياد',
        last_name: 'أحمد محمود',
        phone: '01098765432',
        parent_phone: '01123456789',
        grade_id: 1,
        grade_name: 'الصف الثالث الثانوي',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 2,
        student_id: 102,
        first_name: 'فاطمة',
        last_name: 'خالد مصطفى',
        phone: '01234567891',
        parent_phone: '01011223344',
        grade_id: 2,
        grade_name: 'الصف الثاني الثانوي',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
  } catch {
    return [];
  }
};

const saveOfflineRequests = (items) => {
  localStorage.setItem(OFFLINE_REQUESTS_KEY, JSON.stringify(items));
};

const getOfflineApproved = () => {
  try {
    const saved = localStorage.getItem(OFFLINE_APPROVED_KEY);
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        student: {
          id: 1,
          first_name: 'أحمد',
          last_name: 'محمد الشريف',
          phone: '01012345678',
          parent_phone: '01198765432',
          grade_id: 1
        },
        subscription_code: 'SEC3-101',
        status: 'active',
        start_date: '2026-08-25',
        end_date: '2027-08-25',
        code_expires_at: '2027-08-25'
      },
      {
        id: 2,
        student: {
          id: 2,
          first_name: 'مريم',
          last_name: 'محمود عبد الرحمن',
          phone: '01234567890',
          parent_phone: '01099887766',
          grade_id: 1
        },
        subscription_code: 'SEC3-102',
        status: 'active',
        start_date: '2026-08-26',
        end_date: '2027-08-26',
        code_expires_at: '2027-08-26'
      },
      {
        id: 3,
        student: {
          id: 3,
          first_name: 'عمر',
          last_name: 'خالد الصاوي',
          phone: '01122334455',
          parent_phone: '01555667788',
          grade_id: 2
        },
        subscription_code: 'SEC2-201',
        status: 'active',
        start_date: '2026-08-27',
        end_date: '2027-08-27',
        code_expires_at: '2027-08-27'
      }
    ];
  } catch {
    return [];
  }
};

const saveOfflineApproved = (items) => {
  localStorage.setItem(OFFLINE_APPROVED_KEY, JSON.stringify(items));
};

// ======================================================================
// API ENDPOINTS
// ======================================================================

export const api = {
  // --------------------------------------------------------------------
  // 1. Authentication (Student)
  // --------------------------------------------------------------------

  /**
   * Submit student activation request
   * POST /api/v1/auth/activate
   */
  async activateStudent({ first_name, last_name, phone, parent_phone, grade_id }) {
    const payload = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
      parent_phone: parent_phone.trim(),
      grade_id: Number(grade_id)
    };

    const res = await request('/api/v1/auth/activate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      // Fallback offline simulation
      const current = getOfflineRequests();
      const newReq = {
        id: Date.now(),
        student_id: Math.floor(Math.random() * 900) + 100,
        ...payload,
        grade_name: getGradeNameById(payload.grade_id),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      saveOfflineRequests([newReq, ...current]);
      return {
        success: true,
        isOfflineMode: true,
        status: 'pending',
        message: 'تم تسجيل طلب التفعيل بنجاح! طلبك الآن في انتظار موافقة المعلم لتوليد كود الاشتراك.'
      };
    }

    throw new Error(res.error || 'فشل تقديم طلب التفعيل');
  },

  /**
   * Student Login using subscription_code
   * POST /api/v1/auth/login
   */
  async studentLogin(subscription_code) {
    const cleanCode = subscription_code.trim().toUpperCase();
    const res = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ subscription_code: cleanCode })
    });

    if (res.success) {
      if (res.data?.token) {
        tokenStorage.setStudentToken(res.data.token);
      }
      return res.data;
    }

    if (res.isNetworkError) {
      // Fallback: check approved list or demo codes
      const approved = getOfflineApproved();
      const match = approved.find(a => 
        a.subscription_code?.toUpperCase() === cleanCode && a.status === 'active'
      );
      if (match) {
        const studentInfo = {
          id: match.student?.id || match.id,
          code: match.subscription_code,
          name: `${match.student?.first_name || ''} ${match.student?.last_name || ''}`.trim() || 'طالب متميز',
          grade: getGradeNameById(match.student?.grade_id || 1),
          gradeId: match.student?.grade_id || 1,
          phone: match.student?.phone || '',
          parentPhone: match.student?.parent_phone || '',
          subscriptionStatus: 'active'
        };
        tokenStorage.setStudentToken(`simulated_token_${cleanCode}`);
        return {
          success: true,
          isOfflineMode: true,
          message: 'تم تسجيل الدخول بنجاح',
          student: studentInfo
        };
      }
      throw new Error('كود الاشتراك غير صحيح أو الحساب لم يتم تفعيله بعد من المعلم.');
    }

    throw new Error(res.error || 'كود الاشتراك غير صالح أو الحساب غير مفعّل');
  },

  /**
   * Student Logout
   * POST /api/v1/auth/logout
   */
  async studentLogout() {
    try {
      await request('/api/v1/auth/logout', { method: 'POST' }, 'student');
    } finally {
      tokenStorage.setStudentToken(null);
    }
    return { success: true };
  },

  // --------------------------------------------------------------------
  // 2. Admin Authentication
  // --------------------------------------------------------------------

  /**
   * Admin Login
   * POST /api/v1/admin/auth/login
   */
  async adminLogin(email, password) {
    const res = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password })
    });

    if (res.success) {
      const token = res.data?.token;
      if (token) {
        tokenStorage.setAdminToken(token);
      }
      return res.data;
    }

    if (res.isNetworkError) {
      // Offline fallback: allow predefined admin credentials
      if ((email === 'admin@example.com' && password === 'Admin@12345') || password === 'admin' || password === '123456') {
        const mockToken = 'offline_admin_token_' + Date.now();
        tokenStorage.setAdminToken(mockToken);
        return {
          success: true,
          isOfflineMode: true,
          message: 'تم تسجيل دخول المعلم / الإدارة بنجاح',
          token: mockToken
        };
      }
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }

    throw new Error(res.error || 'فشل تسجيل دخول الإدارة');
  },

  adminLogout() {
    tokenStorage.setAdminToken(null);
  },

  // --------------------------------------------------------------------
  // 3. Admin Activation & Subscriptions
  // --------------------------------------------------------------------

  /**
   * Get pending student activation requests
   * GET /api/v1/admin/activation-requests
   */
  async getPendingActivationRequests() {
    const res = await request('/api/v1/admin/activation-requests', { method: 'GET' }, 'admin');

    if (res.success) {
      return res.data?.data || res.data || [];
    }

    if (res.isNetworkError) {
      return getOfflineRequests();
    }

    throw new Error(res.error || 'فشل تحميل طلبات التفعيل المعلقة');
  },

  /**
   * Approve student activation request
   * POST /api/v1/admin/activation-requests/{subscription}/approve
   */
  async approveActivationRequest(subscriptionId) {
    const res = await request(`/api/v1/admin/activation-requests/${subscriptionId}/approve`, {
      method: 'POST'
    }, 'admin');

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      // Handle offline approval
      const requests = getOfflineRequests();
      const targetReq = requests.find(r => r.id === subscriptionId);
      const remainingReqs = requests.filter(r => r.id !== subscriptionId);
      saveOfflineRequests(remainingReqs);

      const approved = getOfflineApproved();
      const gradePrefix = targetReq?.grade_id === 1 ? 'SEC3' : targetReq?.grade_id === 2 ? 'SEC2' : targetReq?.grade_id === 3 ? 'SEC1' : 'PREP3';
      const genCode = `${gradePrefix}-${Math.floor(Math.random() * 899) + 100}`;

      const newApprovedItem = {
        id: subscriptionId,
        student: {
          id: targetReq?.student_id || subscriptionId,
          first_name: targetReq?.first_name || 'طالب',
          last_name: targetReq?.last_name || 'جديد',
          phone: targetReq?.phone || '',
          parent_phone: targetReq?.parent_phone || '',
          grade_id: targetReq?.grade_id || 1,
        },
        subscription_code: genCode,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        code_expires_at: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
      };

      saveOfflineApproved([newApprovedItem, ...approved]);

      return {
        success: true,
        isOfflineMode: true,
        message: `تمت الموافقة وتفعيل كود الاشتراك [ ${genCode} ] بنجاح!`,
        subscription: newApprovedItem
      };
    }

    throw new Error(res.error || 'فشل قبول طلب التفعيل');
  },

  /**
   * Reject student activation request
   * POST /api/v1/admin/activation-requests/{subscription}/reject
   */
  async rejectActivationRequest(subscriptionId) {
    const res = await request(`/api/v1/admin/activation-requests/${subscriptionId}/reject`, {
      method: 'POST'
    }, 'admin');

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      // Offline fallback: remove from pending list
      const requests = getOfflineRequests();
      const remaining = requests.filter(r => r.id !== subscriptionId);
      saveOfflineRequests(remaining);
      return {
        success: true,
        isOfflineMode: true,
        message: 'تم رفض طلب التفعيل'
      };
    }

    throw new Error(res.error || 'فشل رفض طلب التفعيل');
  },

  /**
   * Get approved students
   * GET /api/v1/admin/approved-students
   */
  async getApprovedStudents() {
    const res = await request('/api/v1/admin/approved-students', { method: 'GET' }, 'admin');

    if (res.success) {
      return res.data?.data || res.data || [];
    }

    if (res.isNetworkError) {
      return getOfflineApproved();
    }

    throw new Error(res.error || 'فشل تحميل قائمة الطلاب المعتمدين');
  },

  /**
   * Deactivate student subscription
   * POST /api/v1/admin/subscriptions/{subscription}/deactivate
   */
  async deactivateSubscription(subscriptionId) {
    const res = await request(`/api/v1/admin/subscriptions/${subscriptionId}/deactivate`, {
      method: 'POST'
    }, 'admin');

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();
      const updated = approved.map(item => {
        if (item.id === subscriptionId) {
          return { ...item, status: 'cancelled' };
        }
        return item;
      });
      saveOfflineApproved(updated);
      return {
        success: true,
        isOfflineMode: true,
        message: 'تم تعطيل الاشتراك بنجاح'
      };
    }

    throw new Error(res.error || 'فشل تعطيل الاشتراك');
  },

  // --------------------------------------------------------------------
  // 4. Admin Students CRUD
  // --------------------------------------------------------------------

  /**
   * Get all students (paginated)
   * GET /api/v1/admin/students?page=1
   */
  async getAllStudents(page = 1) {
    const res = await request(`/api/v1/admin/students?page=${page}`, { method: 'GET' }, 'admin');

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();
      const list = approved.map(a => ({
        id: a.student?.id || a.id,
        first_name: a.student?.first_name,
        last_name: a.student?.last_name,
        name: `${a.student?.first_name || ''} ${a.student?.last_name || ''}`.trim(),
        phone: a.student?.phone,
        parent_phone: a.student?.parent_phone,
        grade_id: a.student?.grade_id || 1,
        grade: getGradeNameById(a.student?.grade_id || 1),
        subscription_code: a.subscription_code,
        status: a.status
      }));
      return {
        data: list,
        current_page: 1,
        last_page: 1,
        total: list.length
      };
    }

    throw new Error(res.error || 'فشل تحميل قائمة الطلاب');
  },

  /**
   * Create student manually by admin
   * POST /api/v1/admin/students
   */
  async createStudentByAdmin(payload) {
    const body = {
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
      phone: payload.phone.trim(),
      parent_phone: payload.parent_phone.trim(),
      grade_id: Number(payload.grade_id),
      start_date: payload.start_date || new Date().toISOString().split('T')[0],
      end_date: payload.end_date || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      code_expires_at: payload.code_expires_at || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    };

    const res = await request('/api/v1/admin/students', {
      method: 'POST',
      body: JSON.stringify(body)
    }, 'admin');

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();
      const prefix = body.grade_id === 1 ? 'SEC3' : body.grade_id === 2 ? 'SEC2' : body.grade_id === 3 ? 'SEC1' : 'PREP3';
      const code = `${prefix}-${Math.floor(Math.random() * 899) + 100}`;
      const newId = Date.now();
      const item = {
        id: newId,
        student: {
          id: newId,
          ...body
        },
        subscription_code: code,
        status: 'active',
        start_date: body.start_date,
        end_date: body.end_date,
        code_expires_at: body.code_expires_at
      };
      saveOfflineApproved([item, ...approved]);
      return {
        success: true,
        isOfflineMode: true,
        message: `تم إنشاء الطالب وتفعيل كود الاشتراك [ ${code} ] بنجاح!`,
        student: item
      };
    }

    throw new Error(res.error || 'فشل إنشاء حساب الطالب');
  },

  /**
   * Get student details
   * GET /api/v1/admin/students/{student}
   */
  async getStudentDetails(studentId) {
    const res = await request(`/api/v1/admin/students/${studentId}`, { method: 'GET' }, 'admin');

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();
      const found = approved.find(a => (a.student?.id == studentId || a.id == studentId));
      if (found) {
        return found;
      }
      throw new Error('لم يتم العثور على بيانات الطالب');
    }

    throw new Error(res.error || 'فشل جلب بيانات الطالب');
  },

  /**
   * Update student
   * PUT /api/v1/admin/students/{student}
   */
  async updateStudent(studentId, payload) {
    const body = {
      first_name: payload.first_name?.trim(),
      last_name: payload.last_name?.trim(),
      phone: payload.phone?.trim(),
      parent_phone: payload.parent_phone?.trim(),
      grade_id: Number(payload.grade_id),
    };

    const res = await request(`/api/v1/admin/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }, 'admin');

    if (res.success) {
      return res.data;
    }

    if (res.isNetworkError) {
      const approved = getOfflineApproved();
      const updated = approved.map(item => {
        if (item.student?.id == studentId || item.id == studentId) {
          return {
            ...item,
            student: {
              ...item.student,
              ...body
            }
          };
        }
        return item;
      });
      saveOfflineApproved(updated);
      return {
        success: true,
        isOfflineMode: true,
        message: 'تم تحديث بيانات الطالب بنجاح'
      };
    }

    throw new Error(res.error || 'فشل تحديث بيانات الطالب');
  }
};

export default api;
