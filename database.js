/**
 * School Management System - Relational Mock Database Layer
 * Handles schema definitions, localStorage persistence, CRUD operations, and timetable triggers.
 */

// Core Table keys in localStorage
const KEYS = {
  USERS: 'sms_users',
  TIMETABLE: 'sms_timetable',
  LEAVES: 'sms_leaves',
  PAYROLL: 'sms_payroll',
  SESSION: 'sms_session'
};

// Standard monthly expected hours for teachers
const EXPECTED_MONTHLY_HOURS = 160;

/**
 * Initialize Database with Seed Data if not present
 */
function initializeDB() {
  // Self-Healing Mechanism: Clear stale localStorage keys if old credentials exist
  const existingUsersJson = localStorage.getItem(KEYS.USERS);
  if (existingUsersJson) {
    try {
      const existingUsers = JSON.parse(existingUsersJson);
      const hasOldPrincipal = existingUsers.some(u => u.username === 'principal_sarah');
      const hasNewPrincipal = existingUsers.some(u => u.username === 'Sureshbhai Patel');
      
      if (hasOldPrincipal || !hasNewPrincipal) {
        // Clear all database tables to force re-seeding with updated credentials and schemas
        localStorage.removeItem(KEYS.USERS);
        localStorage.removeItem(KEYS.TIMETABLE);
        localStorage.removeItem(KEYS.LEAVES);
        localStorage.removeItem(KEYS.PAYROLL);
        localStorage.removeItem(KEYS.SESSION);
      }
    } catch (e) {
      // Clear on parsing errors
      localStorage.clear();
    }
  }

  // 1. Seed Users (with updated Principal credentials)
  if (!localStorage.getItem(KEYS.USERS)) {
    const defaultUsers = [
      {
        id: 'T001',
        username: 'teacher_alice',
        passwordHash: 'alice123', // Initial personal passwords, customizable by admin
        fullName: 'Alice Smith',
        role: 'Teacher',
        baseSalary: 4000,
        hourlyRate: 0
      },
      {
        id: 'T002',
        username: 'teacher_bob',
        passwordHash: 'bob123',
        fullName: 'Bob Jones',
        role: 'Teacher',
        baseSalary: 4480,
        hourlyRate: 0
      },
      {
        id: 'P001',
        username: 'Sureshbhai Patel', // Exclusive Principal username
        passwordHash: 'Surchandra@1170', // Exclusive Principal password
        fullName: 'Sureshbhai Patel',
        role: 'Principal',
        baseSalary: 6000,
        hourlyRate: 0
      }
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Helper to format dates relative to today
  const today = new Date();
  const getPastDateString = (daysAgo) => {
    const d = new Date(today);
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  // 2. Seed Timetable (Lecture Schedule decided by Principal)
  if (!localStorage.getItem(KEYS.TIMETABLE)) {
    const defaultTimetable = [
      // Alice's Daily Lecture Schedule
      {
        id: 'lec_a1',
        userId: 'T001',
        subject: 'Mathematics',
        className: 'Grade 10-A',
        timeSlot: '08:30 AM - 09:30 AM',
        startTime: '08:30',
        endTime: '09:30',
        status: 'Scheduled'
      },
      {
        id: 'lec_a2',
        userId: 'T001',
        subject: 'Geometry',
        className: 'Grade 9-B',
        timeSlot: '09:45 AM - 10:45 AM',
        startTime: '09:45',
        endTime: '10:45',
        status: 'Scheduled'
      },
      {
        id: 'lec_a3',
        userId: 'T001',
        subject: 'Algebra',
        className: 'Grade 10-B',
        timeSlot: '11:00 AM - 12:00 PM',
        startTime: '11:00',
        endTime: '12:00',
        status: 'Scheduled'
      },
      {
        id: 'lec_a4',
        userId: 'T001',
        subject: 'Statistics',
        className: 'Grade 11-A',
        timeSlot: '01:00 PM - 02:00 PM',
        startTime: '13:00',
        endTime: '14:00',
        status: 'Scheduled'
      },

      // Bob's Daily Lecture Schedule
      {
        id: 'lec_b1',
        userId: 'T002',
        subject: 'Physics',
        className: 'Grade 11-B',
        timeSlot: '08:30 AM - 09:30 AM',
        startTime: '08:30',
        endTime: '09:30',
        status: 'Scheduled'
      },
      {
        id: 'lec_b2',
        userId: 'T002',
        subject: 'Chemistry',
        className: 'Grade 10-A',
        timeSlot: '09:45 AM - 10:45 AM',
        startTime: '09:45',
        endTime: '10:45',
        status: 'Scheduled'
      },
      {
        id: 'lec_b3',
        userId: 'T002',
        subject: 'General Science',
        className: 'Grade 8-A',
        timeSlot: '11:00 AM - 12:00 PM',
        startTime: '11:00',
        endTime: '12:00',
        status: 'Scheduled'
      },
      {
        id: 'lec_b4',
        userId: 'T002',
        subject: 'Lab Experiment',
        className: 'Grade 12-A',
        timeSlot: '01:00 PM - 02:00 PM',
        startTime: '13:00',
        endTime: '14:00',
        status: 'Scheduled'
      }
    ];
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(defaultTimetable));
  }

  // 3. Seed Leaves Table
  if (!localStorage.getItem(KEYS.LEAVES)) {
    const defaultLeaves = [
      {
        id: 'lv_1',
        userId: 'T001',
        leaveType: 'Sick',
        startDate: getPastDateString(10),
        endDate: getPastDateString(9),
        reason: 'Severe dental surgery recovery.',
        status: 'Approved',
        appliedOn: `${getPastDateString(12)}T09:15:00.000Z`,
        reviewedBy: 'P001'
      },
      {
        id: 'lv_2',
        userId: 'T002',
        leaveType: 'Casual',
        startDate: getPastDateString(2),
        endDate: getPastDateString(2),
        reason: 'Personal urgent family work.',
        status: 'Approved',
        appliedOn: `${getPastDateString(4)}T14:20:00.000Z`,
        reviewedBy: 'P001'
      },
      {
        id: 'lv_3',
        userId: 'T001',
        leaveType: 'Casual',
        startDate: getPastDateString(-2),
        endDate: getPastDateString(-3),
        reason: 'Family wedding attendance.',
        status: 'Pending',
        appliedOn: `${today.toISOString().split('T')[0]}T08:30:00.000Z`
      }
    ];
    localStorage.setItem(KEYS.LEAVES, JSON.stringify(defaultLeaves));
  }

  // 4. Seed Payroll Table (Flat base salary tracking)
  if (!localStorage.getItem(KEYS.PAYROLL)) {
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthStr = `${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-${lastMonthDate.getFullYear()}`;
    const currentMonthStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    const defaultPayroll = [
      // Last month processed
      {
        id: 'pr_a1',
        userId: 'T001',
        monthYear: lastMonthStr,
        baseSalary: 4000,
        hoursWorked: 0,
        calculatedPayout: 4000,
        paidAmount: 4000,
        pendingBalance: 0,
        status: 'Paid',
        lastUpdated: `${getPastDateString(15)}T10:00:00.000Z`
      },
      {
        id: 'pr_b1',
        userId: 'T002',
        monthYear: lastMonthStr,
        baseSalary: 4480,
        hoursWorked: 0,
        calculatedPayout: 4480,
        paidAmount: 4480,
        pendingBalance: 0,
        status: 'Paid',
        lastUpdated: `${getPastDateString(15)}T10:15:00.000Z`
      },
      // Current month
      {
        id: 'pr_a2',
        userId: 'T001',
        monthYear: currentMonthStr,
        baseSalary: 4000,
        hoursWorked: 0,
        calculatedPayout: 4000,
        paidAmount: 0,
        pendingBalance: 4000,
        status: 'Unpaid',
        lastUpdated: today.toISOString()
      },
      {
        id: 'pr_b2',
        userId: 'T002',
        monthYear: currentMonthStr,
        baseSalary: 4480,
        hoursWorked: 0,
        calculatedPayout: 4480,
        paidAmount: 0,
        pendingBalance: 4480,
        status: 'Unpaid',
        lastUpdated: today.toISOString()
      }
    ];
    localStorage.setItem(KEYS.PAYROLL, JSON.stringify(defaultPayroll));
    recalculatePayrollForAll(currentMonthStr);
  }
}

/**
 * Core DB Getter Utilities
 */
const DB = {
  getUsers: () => JSON.parse(localStorage.getItem(KEYS.USERS)) || [],
  
  getTimetable: () => JSON.parse(localStorage.getItem(KEYS.TIMETABLE)) || [],
  
  getLeaves: () => JSON.parse(localStorage.getItem(KEYS.LEAVES)) || [],
  
  getPayroll: () => JSON.parse(localStorage.getItem(KEYS.PAYROLL)) || [],

  setUsers: (data) => localStorage.setItem(KEYS.USERS, JSON.stringify(data)),
  
  setTimetable: (data) => localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(data)),
  
  setLeaves: (data) => localStorage.setItem(KEYS.LEAVES, JSON.stringify(data)),
  
  setPayroll: (data) => localStorage.setItem(KEYS.PAYROLL, JSON.stringify(data))
};

/**
 * Authentication Helper
 */
function authenticateUser(username, password) {
  const users = DB.getUsers();
  const user = users.find(u => u.username.toLowerCase().trim() === username.toLowerCase().trim() && u.passwordHash === password);
  if (user) {
    const session = { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    return session;
  }
  return null;
}

function getActiveSession() {
  return JSON.parse(localStorage.getItem(KEYS.SESSION)) || null;
}

function clearActiveSession() {
  localStorage.removeItem(KEYS.SESSION);
}

/**
 * Teacher Registration (Sign Up)
 */
function registerUser(fullName, username, password, role = 'Teacher') {
  if (role === 'Principal') {
    return { success: false, message: 'Registration blocked: Only Sureshbhai Patel is allowed as the Principal.' };
  }
  
  const users = DB.getUsers();
  
  const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return { success: false, message: 'Username already exists. Please choose another.' };
  }
  
  const newUser = {
    id: 'T_' + Math.random().toString(36).substr(2, 9),
    username: username,
    passwordHash: password,
    fullName: fullName,
    role: 'Teacher',
    baseSalary: 3500,
    hourlyRate: 0
  };
  
  users.push(newUser);
  DB.setUsers(users);
  
  const today = new Date();
  const currentMonthStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  recalculatePayroll(newUser.id, currentMonthStr);
  
  const session = { id: newUser.id, username: newUser.username, fullName: newUser.fullName, role: newUser.role };
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  
  return { success: true, user: newUser };
}

/**
 * Staff Directory Management Operations (Principal View Only)
 */

// Add a new teacher
function addTeacher(fullName, username, password, baseSalary) {
  const users = DB.getUsers();
  
  const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return { success: false, message: 'Username already exists. Please choose another.' };
  }
  
  const newTeacher = {
    id: 'T_' + Math.random().toString(36).substr(2, 9),
    username: username,
    passwordHash: password,
    fullName: fullName,
    role: 'Teacher',
    baseSalary: parseFloat(baseSalary),
    hourlyRate: 0
  };
  
  users.push(newTeacher);
  DB.setUsers(users);
  
  const today = new Date();
  const currentMonthStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  recalculatePayroll(newTeacher.id, currentMonthStr);
  
  return { success: true, teacher: newTeacher };
}

// Update existing teacher
function updateTeacher(userId, fullName, username, password, baseSalary) {
  const users = DB.getUsers();
  const teacher = users.find(u => u.id === userId);
  
  if (!teacher) {
    return { success: false, message: 'Teacher record not found.' };
  }
  
  if (teacher.username.toLowerCase() !== username.toLowerCase()) {
    const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return { success: false, message: 'Username already in use.' };
    }
  }
  
  teacher.fullName = fullName;
  teacher.username = username;
  if (password.trim() !== '') {
    teacher.passwordHash = password;
  }
  teacher.baseSalary = parseFloat(baseSalary);
  
  DB.setUsers(users);
  
  const today = new Date();
  const currentMonthStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  recalculatePayroll(userId, currentMonthStr);
  
  return { success: true, teacher };
}

// Delete teacher record and clean up associated tables
function deleteTeacher(userId) {
  let users = DB.getUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    return { success: false, message: 'Teacher not found.' };
  }
  
  users.splice(index, 1);
  DB.setUsers(users);
  
  let timetable = DB.getTimetable().filter(r => r.userId !== userId);
  DB.setTimetable(timetable);
  
  let leaves = DB.getLeaves().filter(r => r.userId !== userId);
  DB.setLeaves(leaves);
  
  let payroll = DB.getPayroll().filter(r => r.userId !== userId);
  DB.setPayroll(payroll);
  
  return { success: true };
}

/**
 * Timetable Scheduler Operations (Decided by Principal)
 */

// Add a lecture to a teacher's schedule
function addLecture(userId, subject, className, timeSlot, startTime, endTime) {
  const timetable = DB.getTimetable();
  
  const overlap = timetable.find(t => t.userId === userId && t.timeSlot.toLowerCase() === timeSlot.toLowerCase());
  if (overlap) {
    return { success: false, message: `Overlap detected: This teacher already has a lecture scheduled for ${timeSlot}.` };
  }

  const newLecture = {
    id: 'lec_' + Math.random().toString(36).substr(2, 9),
    userId: userId,
    subject: subject,
    className: className,
    timeSlot: timeSlot,
    startTime: startTime,
    endTime: endTime,
    status: 'Scheduled'
  };
  
  timetable.push(newLecture);
  DB.setTimetable(timetable);
  return { success: true, lecture: newLecture };
}

// Update a scheduled lecture details
function updateLecture(lectureId, subject, className, timeSlot, startTime, endTime) {
  const timetable = DB.getTimetable();
  const lecture = timetable.find(l => l.id === lectureId);
  
  if (!lecture) {
    return { success: false, message: 'Lecture not found.' };
  }
  
  lecture.subject = subject;
  lecture.className = className;
  lecture.timeSlot = timeSlot;
  lecture.startTime = startTime;
  lecture.endTime = endTime;
  
  DB.setTimetable(timetable);
  return { success: true, lecture };
}

// Remove a scheduled lecture
function deleteLecture(lectureId) {
  let timetable = DB.getTimetable();
  const index = timetable.findIndex(l => l.id === lectureId);
  
  if (index === -1) {
    return { success: false, message: 'Lecture not found.' };
  }
  
  timetable.splice(index, 1);
  DB.setTimetable(timetable);
  return { success: true };
}

/**
 * Leave Operations
 */

// Teacher submits a leave request
function submitLeave(userId, leaveType, startDate, endDate, reason) {
  const leaves = DB.getLeaves();
  
  const newLeave = {
    id: 'lv_' + Math.random().toString(36).substr(2, 9),
    userId: userId,
    leaveType: leaveType,
    startDate: startDate,
    endDate: endDate,
    reason: reason,
    status: 'Pending',
    appliedOn: new Date().toISOString()
  };
  
  leaves.push(newLeave);
  DB.setLeaves(leaves);
  return { success: true, leave: newLeave };
}

// Principal approves or rejects leave
function reviewLeave(leaveId, principalId, approveStatus, comment = '') {
  const leaves = DB.getLeaves();
  const leave = leaves.find(l => l.id === leaveId);
  
  if (!leave || leave.status !== 'Pending') {
    return { success: false, message: 'Pending leave request not found.' };
  }
  
  leave.status = approveStatus;
  leave.reviewedBy = principalId;
  leave.reviewComment = comment;
  
  DB.setLeaves(leaves);
  return { success: true, leave };
}

/**
 * Payroll Operations & Calculations
 */

// Calculate and update payroll entry for a specific user and month
function recalculatePayroll(userId, monthYear) {
  const users = DB.getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== 'Teacher') return;
  
  const payrolls = DB.getPayroll();
  
  let calculatedPayout = user.baseSalary;
  calculatedPayout = Math.max(0, Math.round(calculatedPayout * 100) / 100);
  
  let payrollRecord = payrolls.find(p => p.userId === userId && p.monthYear === monthYear);
  
  if (payrollRecord) {
    payrollRecord.baseSalary = user.baseSalary;
    payrollRecord.calculatedPayout = calculatedPayout;
    payrollRecord.pendingBalance = Math.max(0, Math.round((calculatedPayout - payrollRecord.paidAmount) * 100) / 100);
    
    if (payrollRecord.pendingBalance === 0 && payrollRecord.calculatedPayout > 0) {
      payrollRecord.status = 'Paid';
    } else if (payrollRecord.paidAmount > 0) {
      payrollRecord.status = 'Partial';
    } else {
      payrollRecord.status = 'Unpaid';
    }
    payrollRecord.lastUpdated = new Date().toISOString();
  } else {
    payrollRecord = {
      id: 'pr_' + Math.random().toString(36).substr(2, 9),
      userId: userId,
      monthYear: monthYear,
      baseSalary: user.baseSalary,
      hoursWorked: 0,
      calculatedPayout: calculatedPayout,
      paidAmount: 0,
      pendingBalance: calculatedPayout,
      status: 'Unpaid',
      lastUpdated: new Date().toISOString()
    };
    payrolls.push(payrollRecord);
  }
  
  DB.setPayroll(payrolls);
}

// Recalculate payroll for all teachers for a specific month
function recalculatePayrollForAll(monthYear) {
  const users = DB.getUsers().filter(u => u.role === 'Teacher');
  users.forEach(u => recalculatePayroll(u.id, monthYear));
}

// Principal settles a payment
function makePayment(payrollId, amount) {
  const payrolls = DB.getPayroll();
  const record = payrolls.find(p => p.id === payrollId);
  
  if (!record) {
    return { success: false, message: 'Payroll record not found.' };
  }
  
  const payment = parseFloat(amount);
  if (isNaN(payment) || payment <= 0) {
    return { success: false, message: 'Please enter a valid payment amount.' };
  }
  
  if (payment > record.pendingBalance) {
    return { success: false, message: 'Payment amount exceeds pending balance.' };
  }
  
  record.paidAmount = Math.round((record.paidAmount + payment) * 100) / 100;
  record.pendingBalance = Math.round((record.calculatedPayout - record.paidAmount) * 100) / 100;
  
  if (record.pendingBalance === 0) {
    record.status = 'Paid';
  } else {
    record.status = 'Partial';
  }
  
  record.lastUpdated = new Date().toISOString();
  DB.setPayroll(payrolls);
  return { success: true, record };
}

/**
 * Dashboard & Analytics Computations
 */

// Compute high-level analytics for the Principal
function getPrincipalAnalytics(year = 2026) {
  const timetable = DB.getTimetable();
  const leaves = DB.getLeaves();
  const users = DB.getUsers().filter(u => u.role === 'Teacher');
  const payrolls = DB.getPayroll();
  
  const teacherCount = users.length;
  const totalLecturesCount = timetable.length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  
  const monthlyData = Array.from({ length: 12 }, (_, index) => {
    const monthIndex = index;
    const loadMultiplier = [0.85, 0.9, 0.95, 0.9, 0.8, 0.75, 0.2, 0.5, 0.9, 0.95, 0.9, 0.85];
    const rate = Math.round(loadMultiplier[monthIndex] * 100);
    
    return {
      month: new Date(year, monthIndex, 1).toLocaleString('default', { month: 'short' }),
      rate: rate,
      hours: Math.round(rate * 1.6)
    };
  });
  
  const currentMonthStr = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}`;
  const currentPayrolls = payrolls.filter(p => p.monthYear === currentMonthStr);
  const totalPayrollBudget = currentPayrolls.reduce((sum, p) => sum + p.calculatedPayout, 0);
  const totalPaidAmount = currentPayrolls.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPendingAmount = currentPayrolls.reduce((sum, p) => sum + p.pendingBalance, 0);

  return {
    teacherCount,
    attendanceRate: 98,
    totalHoursWorked: totalLecturesCount,
    pendingLeavesCount,
    pendingAdjustmentsCount: 0,
    monthlyData,
    payrollSummary: {
      totalBudget: Math.round(totalPayrollBudget * 100) / 100,
      paid: Math.round(totalPaidAmount * 100) / 100,
      pending: Math.round(totalPendingAmount * 100) / 100
    }
  };
}

// Initial DB Execution
initializeDB();
