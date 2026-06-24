/**
 * School Management System - Main Application Controller
 * Manages routing, auth guards, DOM rendering, and business operations.
 */

// Core DOM Elements
const elements = {
  mainHeader: document.getElementById('main-header'),
  headerUserName: document.getElementById('header-user-name'),
  headerUserRole: document.getElementById('header-user-role'),
  btnLogout: document.getElementById('btn-logout'),
  debugSimContainer: document.getElementById('debug-sim-container'),
  btnSimulateMonthEnd: document.getElementById('btn-simulate-month-end'),
  payrollReviewBanner: document.getElementById('payroll-review-banner'),
  
  viewContainer: document.getElementById('view-container'),
  viewAuth: document.getElementById('view-auth'),
  viewTeacher: document.getElementById('view-teacher'),
  viewPrincipal: document.getElementById('view-principal'),
  
  // Login Form elements
  authCardSubtitle: document.getElementById('auth-card-subtitle'),
  authErrorAlert: document.getElementById('auth-error-alert'),
  authSigninContainer: document.getElementById('auth-signin-container'),
  authSignupContainer: document.getElementById('auth-signup-container'),
  loginForm: document.getElementById('login-form'),
  usernameInput: document.getElementById('username'),
  passwordInput: document.getElementById('password'),
  linkToSignup: document.getElementById('link-to-signup'),
  linkToSignin: document.getElementById('link-to-signin'),
  btnResetDb: document.getElementById('btn-reset-db'),
  
  // Registration Form elements (Teacher-Exclusive)
  signupForm: document.getElementById('signup-form'),
  signupFullname: document.getElementById('signup-fullname'),
  signupUsername: document.getElementById('signup-username'),
  signupPassword: document.getElementById('signup-password'),
  
  // Teacher elements
  tStatRate: document.getElementById('t-stat-rate'), // Lectures count today
  tStatHours: document.getElementById('t-stat-hours'), // Pending leaves count
  tStatLeaves: document.getElementById('t-stat-leaves'), // Next lecture start time
  liveDate: document.getElementById('live-date'),
  liveTime: document.getElementById('live-time'),
  teacherAttendanceLogs: document.getElementById('teacher-attendance-logs'),
  teacherLeaveLogs: document.getElementById('teacher-leave-logs'),
  leaveRequestForm: document.getElementById('leave-request-form'),
  
  // Teacher dynamic cards
  lecNowSubject: document.getElementById('lec-now-subject'),
  lecNowClass: document.getElementById('lec-now-class'),
  lecNowTime: document.getElementById('lec-now-time'),
  lecNextSubject: document.getElementById('lec-next-subject'),
  lecNextClass: document.getElementById('lec-next-class'),
  lecNextTime: document.getElementById('lec-next-time'),
  
  // Principal elements
  pStatHours: document.getElementById('p-stat-hours'),
  pStatCount: document.getElementById('p-stat-count'),
  pStatPending: document.getElementById('p-stat-pending'),
  pOverrideFilterTeacher: document.getElementById('p-override-filter-teacher'),
  principalAttendanceRecords: document.getElementById('principal-attendance-records'),
  principalAttendanceChart: document.getElementById('principal-attendance-chart'),
  principalLeavesInbox: document.getElementById('principal-leaves-inbox'),
  principalPayrollLedger: document.getElementById('principal-payroll-ledger'),
  principalStaffList: document.getElementById('principal-staff-list'),
  analyticsPeakMonth: document.getElementById('analytics-peak-month'),
  analyticsAnnualHours: document.getElementById('analytics-annual-hours'),
  
  // Tabs
  pTabDashboard: document.getElementById('principal-tab-dashboard'),
  pTabLeaves: document.getElementById('principal-tab-leaves'),
  pTabPayroll: document.getElementById('principal-tab-payroll'),
  pTabStaff: document.getElementById('principal-tab-staff')
};

// State trackers
let currentSession = null;
let principalActiveTab = 'dashboard';

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  startLiveClock();
});

/**
 * Initialize application state and global event handlers
 */
function initApp() {
  // Authentication Form switches
  elements.linkToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthView('signup');
  });
  
  elements.linkToSignin.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthView('signin');
  });

  // Setup Database Reset Action
  if (elements.btnResetDb) {
    elements.btnResetDb.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('This will completely reset all scheduled lectures, payroll entries, and custom teacher profiles. Do you want to proceed?')) {
        localStorage.clear();
        location.reload();
      }
    });
  }

  // Setup submissions
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.signupForm.addEventListener('submit', handleSignupSubmit);
  elements.btnLogout.addEventListener('click', handleLogout);
  
  // Teacher Leave Request submission
  elements.leaveRequestForm.addEventListener('submit', handleLeaveSubmit);
  
  // Principal filters
  elements.pOverrideFilterTeacher.addEventListener('change', () => {
    renderPrincipalAttendanceTable();
  });
  
  // Debug Month End Simulator
  elements.btnSimulateMonthEnd.addEventListener('click', triggerMonthEndSimulation);
  
  // Modals Submit Handlers
  document.getElementById('pay-salary-form').addEventListener('submit', handlePaySalarySubmit);
  document.getElementById('staff-form').addEventListener('submit', handleStaffSubmit);
  document.getElementById('lecture-form').addEventListener('submit', handleLectureSubmit);

  // Listen for storage changes to sync database updates across tabs instantly
  window.addEventListener('storage', (e) => {
    if (Object.values(KEYS).includes(e.key)) {
      checkRouteGuard();
    }
  });

  // Check active session
  checkRouteGuard();
}

/**
 * Simple client-side route protection
 */
function checkRouteGuard() {
  currentSession = getActiveSession();
  
  // Hide all main sections
  elements.viewAuth.classList.add('hidden');
  elements.viewTeacher.classList.add('hidden');
  elements.viewPrincipal.classList.add('hidden');
  elements.mainHeader.classList.add('hidden');
  elements.debugSimContainer.classList.add('hidden');
  
  if (currentSession) {
    elements.viewContainer.className = 'dashboard-container';
    elements.mainHeader.classList.remove('hidden');
    elements.headerUserName.textContent = currentSession.fullName;
    elements.headerUserRole.textContent = currentSession.role;
    
    if (currentSession.role === 'Teacher') {
      elements.viewTeacher.classList.remove('hidden');
      renderTeacherDashboard();
    } else if (currentSession.role === 'Principal') {
      elements.viewPrincipal.classList.remove('hidden');
      elements.debugSimContainer.classList.remove('hidden');
      setupPrincipalTeacherFilter();
      renderPrincipalDashboard();
    }
  } else {
    elements.viewContainer.className = 'auth-wrapper';
    elements.viewAuth.classList.remove('hidden');
    elements.authErrorAlert.style.display = 'none';
    toggleAuthView('signin'); // default on boot
  }
}

/**
 * Toggles Auth Panel UI between Sign In and Sign Up
 */
function toggleAuthView(view) {
  elements.authErrorAlert.style.display = 'none';
  if (view === 'signup') {
    elements.authSigninContainer.classList.add('hidden');
    elements.authSignupContainer.classList.remove('hidden');
    elements.authCardSubtitle.textContent = 'Register a new Teacher account';
  } else {
    elements.authSignupContainer.classList.add('hidden');
    elements.authSigninContainer.classList.remove('hidden');
    elements.authCardSubtitle.textContent = 'Sign in to your dashboard';
  }
}

/**
 * Authentication Actions
 */
function handleLogin(e) {
  e.preventDefault();
  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value;
  
  const session = authenticateUser(username, password);
  
  if (session) {
    elements.usernameInput.value = '';
    elements.passwordInput.value = '';
    elements.authErrorAlert.style.display = 'none';
    checkRouteGuard();
  } else {
    elements.authErrorAlert.textContent = 'Invalid username or password. Please try again.';
    elements.authErrorAlert.style.display = 'block';
  }
}

/**
 * Corrected Sign Up Form Submission (No crashes)
 */
function handleSignupSubmit(e) {
  e.preventDefault();
  const fullName = elements.signupFullname.value.trim();
  const username = elements.signupUsername.value.trim();
  const password = elements.signupPassword.value;
  
  // Public registration restricted to 'Teacher' role with standard starting pay
  const role = 'Teacher';
  const baseSalary = 3500; 
  
  const res = registerUser(fullName, username, password, role, baseSalary, 0);
  
  if (res.success) {
    elements.signupFullname.value = '';
    elements.signupUsername.value = '';
    elements.signupPassword.value = '';
    elements.authErrorAlert.style.display = 'none';
    checkRouteGuard(); // Auto log in and route
  } else {
    elements.authErrorAlert.textContent = res.message;
    elements.authErrorAlert.style.display = 'block';
    elements.viewAuth.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleLogout() {
  clearActiveSession();
  elements.payrollReviewBanner.classList.add('hidden');
  checkRouteGuard();
}

/**
 * Clock Interface & Digital Display
 */
function startLiveClock() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  function updateClock() {
    const now = new Date();
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dateNum = now.getDate();
    const yearNum = now.getFullYear();
    if (elements.liveDate) {
      elements.liveDate.textContent = `${dayName}, ${monthName} ${dateNum}, ${yearNum}`;
    }
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    
    if (elements.liveTime) {
      elements.liveTime.textContent = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
    }
    
    if (currentSession && currentSession.role === 'Teacher') {
      updateTeacherNowNextLecture();
    }
  }
  
  updateClock();
  setInterval(updateClock, 1000); 
}

/**
 * =========================================================================
 * TEACHER DASHBOARD CORE RENDERING
 * =========================================================================
 */
function renderTeacherDashboard() {
  const userId = currentSession.id;
  const timetable = DB.getTimetable().filter(r => r.userId === userId);
  const leaves = DB.getLeaves().filter(r => r.userId === userId);
  
  elements.tStatRate.textContent = timetable.length.toString(); 
  elements.tStatHours.textContent = leaves.filter(l => l.status === 'Pending').length.toString(); 
  
  const { nextLecture } = getNowAndNextLecture(userId);
  elements.tStatLeaves.textContent = nextLecture ? formatTimeFromHours(nextLecture.startTime) : 'N/A';
  
  updateTeacherNowNextLecture();
  renderTeacherTimetableTable(timetable);
  renderTeacherLeavesTable(leaves);
}

function getNowAndNextLecture(teacherId) {
  const timetable = DB.getTimetable().filter(entry => entry.userId === teacherId);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  let currentLecture = null;
  let nextLecture = null;
  let minNextDiff = Infinity;
  
  timetable.forEach(entry => {
    const [sh, sm] = entry.startTime.split(':').map(Number);
    const [eh, em] = entry.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      currentLecture = entry;
    } else if (startMin > currentMinutes) {
      const diff = startMin - currentMinutes;
      if (diff < minNextDiff) {
        minNextDiff = diff;
        nextLecture = entry;
      }
    }
  });
  
  return { currentLecture, nextLecture };
}

function updateTeacherNowNextLecture() {
  const userId = currentSession.id;
  const { currentLecture, nextLecture } = getNowAndNextLecture(userId);
  
  if (currentLecture) {
    elements.lecNowSubject.textContent = currentLecture.subject;
    elements.lecNowClass.textContent = currentLecture.className;
    elements.lecNowTime.textContent = currentLecture.timeSlot;
    document.getElementById('lecture-now-card').style.opacity = '1';
  } else {
    elements.lecNowSubject.textContent = 'Free Period';
    elements.lecNowClass.textContent = 'No active lecture currently conducting';
    elements.lecNowTime.textContent = '--:--';
    document.getElementById('lecture-now-card').style.opacity = '0.7';
  }
  
  if (nextLecture) {
    elements.lecNextSubject.textContent = nextLecture.subject;
    elements.lecNextClass.textContent = nextLecture.className;
    elements.lecNextTime.textContent = nextLecture.timeSlot;
  } else {
    elements.lecNextSubject.textContent = 'No Upcoming Classes';
    elements.lecNextClass.textContent = 'Schedule completed for the day';
    elements.lecNextTime.textContent = '--:--';
  }
}

function renderTeacherTimetableTable(timetable) {
  const tbody = elements.teacherAttendanceLogs;
  tbody.innerHTML = '';
  
  const sorted = [...timetable].sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No lectures scheduled for you today.</td></tr>';
    return;
  }
  
  sorted.forEach(record => {
    const tr = document.createElement('tr');
    
    let statusClass = 'badge-success';
    if (record.status === 'Cancelled') statusClass = 'badge-danger';
    
    tr.innerHTML = `
      <td><strong>${record.timeSlot}</strong></td>
      <td>${record.subject}</td>
      <td><span class="badge badge-info">${record.className}</span></td>
      <td><span class="badge ${statusClass}">${record.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTeacherLeavesTable(leaves) {
  const tbody = elements.teacherLeaveLogs;
  tbody.innerHTML = '';
  
  const sorted = [...leaves].sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
  
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No leave requests submitted yet.</td></tr>';
    return;
  }
  
  sorted.forEach(leave => {
    const tr = document.createElement('tr');
    
    let badgeClass = 'badge-warning';
    if (leave.status === 'Approved') badgeClass = 'badge-success';
    if (leave.status === 'Rejected') badgeClass = 'badge-danger';
    
    const datesStr = leave.startDate === leave.endDate 
      ? formatDatePretty(leave.startDate)
      : `${formatDatePretty(leave.startDate)} to ${formatDatePretty(leave.endDate)}`;
      
    tr.innerHTML = `
      <td><strong>${leave.leaveType}</strong></td>
      <td>${datesStr}</td>
      <td>${escapeHtml(leave.reason)}</td>
      <td><span class="badge ${badgeClass}">${leave.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function handleLeaveSubmit(e) {
  e.preventDefault();
  const startDate = document.getElementById('leave-start-date').value;
  const endDate = document.getElementById('leave-end-date').value;
  const leaveType = document.getElementById('leave-type').value;
  const reason = document.getElementById('leave-reason').value.trim();
  
  if (new Date(startDate) > new Date(endDate)) {
    alert('Start date cannot be after end date.');
    return;
  }
  
  const res = submitLeave(currentSession.id, leaveType, startDate, endDate, reason);
  if (res.success) {
    elements.leaveRequestForm.reset();
    renderTeacherDashboard();
  }
}

/**
 * =========================================================================
 * PRINCIPAL DASHBOARD CORE RENDERING (INSTANT DRAWS)
 * =========================================================================
 */
function switchPrincipalTab(tabName) {
  principalActiveTab = tabName;
  
  document.getElementById('p-tab-dashboard-btn').classList.remove('active');
  document.getElementById('p-tab-leaves-btn').classList.remove('active');
  document.getElementById('p-tab-payroll-btn').classList.remove('active');
  document.getElementById('p-tab-staff-btn').classList.remove('active');
  
  elements.pTabDashboard.classList.add('hidden');
  elements.pTabLeaves.classList.add('hidden');
  elements.pTabPayroll.classList.add('hidden');
  elements.pTabStaff.classList.add('hidden');
  
  document.getElementById(`p-tab-${tabName}-btn`).classList.add('active');
  
  // Instant DOM Rendering without setTimeout delays
  if (tabName === 'dashboard') {
    elements.pTabDashboard.classList.remove('hidden');
    renderPrincipalDashboardView();
  } else if (tabName === 'leaves') {
    elements.pTabLeaves.classList.remove('hidden');
    renderPrincipalLeavesInbox();
  } else if (tabName === 'payroll') {
    elements.pTabPayroll.classList.remove('hidden');
    renderPrincipalPayrollLedger();
  } else if (tabName === 'staff') {
    elements.pTabStaff.classList.remove('hidden');
    renderPrincipalStaffDirectory();
  }
}

function setupPrincipalTeacherFilter() {
  const filter = elements.pOverrideFilterTeacher;
  const previousVal = filter.value || 'All';
  filter.innerHTML = '<option value="All">All Staff Timetables</option>';
  
  const teachers = DB.getUsers().filter(u => u.role === 'Teacher');
  teachers.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.fullName;
    filter.appendChild(opt);
  });
  
  const stillExists = teachers.some(t => t.id === previousVal);
  filter.value = stillExists || previousVal === 'All' ? previousVal : 'All';
}

function renderPrincipalDashboard() {
  switchPrincipalTab(principalActiveTab);
}

function renderPrincipalDashboardView() {
  const analytics = getPrincipalAnalytics();
  
  elements.pStatHours.textContent = analytics.totalHoursWorked.toString(); 
  elements.pStatCount.textContent = analytics.teacherCount.toString();
  
  const totalPending = analytics.pendingLeavesCount;
  elements.pStatPending.textContent = totalPending.toString();
  if (totalPending > 0) {
    elements.pStatPending.style.color = 'var(--color-warning)';
  } else {
    elements.pStatPending.style.color = 'var(--text-primary)';
  }
  
  renderAnalyticsChart(analytics.monthlyData);
  renderPrincipalAttendanceTable(); 
}

function renderAnalyticsChart(monthlyData) {
  const chartContainer = elements.principalAttendanceChart;
  const gridLines = chartContainer.querySelectorAll('.chart-y-axis');
  chartContainer.innerHTML = '';
  if (gridLines.length > 0) {
    chartContainer.appendChild(gridLines[0]);
  } else {
    chartContainer.innerHTML = `
      <div class="chart-y-axis">
        <div class="chart-grid-line"></div>
        <div class="chart-grid-line"></div>
        <div class="chart-grid-line"></div>
      </div>
    `;
  }
  
  let peakRate = -1;
  let peakMonthName = 'N/A';
  
  monthlyData.forEach(m => {
    if (m.rate > peakRate && m.rate > 0) {
      peakRate = m.rate;
      peakMonthName = m.month;
    }
  });
  
  elements.analyticsPeakMonth.textContent = peakMonthName !== 'N/A' ? `${peakMonthName} (${peakRate}% Load)` : 'N/A';
  elements.analyticsAnnualHours.textContent = `${DB.getTimetable().length} lectures`;

  monthlyData.forEach(m => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-bar-wrapper';
    
    const barHeight = m.rate > 0 ? `${m.rate}%` : '5%';
    
    wrapper.innerHTML = `
      <div class="chart-bar-value">${m.rate}% Load</div>
      <div class="chart-bar" style="height: ${barHeight};"></div>
      <div class="chart-label">${m.month}</div>
    `;
    chartContainer.appendChild(wrapper);
  });
}

function renderPrincipalAttendanceTable() {
  const tbody = elements.principalAttendanceRecords;
  tbody.innerHTML = '';
  
  const filterVal = elements.pOverrideFilterTeacher.value;
  const timetable = DB.getTimetable();
  const users = DB.getUsers();
  
  let records = timetable;
  if (filterVal !== 'All') {
    records = timetable.filter(r => r.userId === filterVal);
  }
  
  records.sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No lectures scheduled in the timetable.</td></tr>';
    return;
  }
  
  records.forEach(record => {
    const tr = document.createElement('tr');
    const teacher = users.find(u => u.id === record.userId);
    const teacherName = teacher ? teacher.fullName : 'Unknown Teacher';
    
    tr.innerHTML = `
      <td><strong>${teacherName}</strong></td>
      <td>${record.subject}</td>
      <td><span class="badge badge-info">${record.className}</span></td>
      <td>${record.timeSlot}</td>
      <td class="text-right">
        <button class="btn btn-outline btn-small" onclick="openLectureModal('${record.id}')" style="margin-right:5px;">Edit</button>
        <button class="btn btn-danger btn-small" onclick="handleDeleteLecture('${record.id}')">Delete</button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

function renderPrincipalLeavesInbox() {
  const tbody = elements.principalLeavesInbox;
  tbody.innerHTML = '';
  
  const leaves = DB.getLeaves();
  const users = DB.getUsers();
  
  const sorted = [...leaves].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.appliedOn) - new Date(a.appliedOn);
  });
  
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No leave requests found.</td></tr>';
    return;
  }
  
  sorted.forEach(leave => {
    const tr = document.createElement('tr');
    const teacher = users.find(u => u.id === leave.userId);
    const teacherName = teacher ? teacher.fullName : 'Unknown Staff';
    
    const datesStr = leave.startDate === leave.endDate 
      ? formatDatePretty(leave.startDate)
      : `${formatDatePretty(leave.startDate)} to ${formatDatePretty(leave.endDate)}`;
      
    const appliedStr = formatDatePretty(leave.appliedOn.split('T')[0]);
    
    let actionHtml = '';
    if (leave.status === 'Pending') {
      actionHtml = `
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <input type="text" id="comment-${leave.id}" class="form-control" placeholder="Optional comment..." style="padding: 5px 10px; font-size: 0.8rem; max-width: 150px;">
          <button class="btn btn-primary btn-small" onclick="handleLeaveDecision('${leave.id}', 'Approved')">Approve</button>
          <button class="btn btn-danger btn-small" onclick="handleLeaveDecision('${leave.id}', 'Rejected')">Reject</button>
        </div>
      `;
    } else {
      const badgeClass = leave.status === 'Approved' ? 'badge-success' : 'badge-danger';
      actionHtml = `<span class="badge ${badgeClass}">${leave.status}</span>`;
    }
    
    const reviewCommentText = leave.reviewComment ? escapeHtml(leave.reviewComment) : '<span style="color:var(--text-muted)">--</span>';
    
    tr.innerHTML = `
      <td><strong>${teacherName}</strong></td>
      <td>${leave.leaveType}</td>
      <td>${datesStr}</td>
      <td>${escapeHtml(leave.reason)}</td>
      <td>${appliedStr}</td>
      <td>${reviewCommentText}</td>
      <td class="text-right">${actionHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPrincipalPayrollLedger() {
  const tbody = elements.principalPayrollLedger;
  tbody.innerHTML = '';
  
  const payroll = DB.getPayroll();
  const users = DB.getUsers();
  
  const sorted = [...payroll].sort((a, b) => b.monthYear.localeCompare(a.monthYear));
  
  let totalBudget = 0;
  let totalSettled = 0;
  let totalPending = 0;
  
  const currentMonthStr = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}`;
  const currentPayrolls = payroll.filter(p => p.monthYear === currentMonthStr);
  
  currentPayrolls.forEach(p => {
    totalBudget += p.calculatedPayout;
    totalSettled += p.paidAmount;
    totalPending += p.pendingBalance;
  });
  
  elements.ledgerTotBudget.textContent = `$${totalBudget.toFixed(2)}`;
  elements.ledgerTotSettled.textContent = `$${totalSettled.toFixed(2)}`;
  elements.ledgerTotPending.textContent = `$${totalPending.toFixed(2)}`;
  
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No payroll logs generated.</td></tr>';
    return;
  }
  
  sorted.forEach(record => {
    const tr = document.createElement('tr');
    const teacher = users.find(u => u.id === record.userId);
    const teacherName = teacher ? teacher.fullName : 'Unknown Staff';
    
    let statusClass = 'badge-warning';
    if (record.status === 'Paid') statusClass = 'badge-success';
    if (record.status === 'Unpaid') statusClass = 'badge-danger';
    
    let actionHtml = '--';
    if (record.pendingBalance > 0) {
      actionHtml = `<button class="btn btn-secondary btn-small" onclick="openPaySalaryModal('${record.id}')">Pay Salary</button>`;
    } else {
      actionHtml = `<span class="badge badge-success">Fully Settled</span>`;
    }
    
    tr.innerHTML = `
      <td><strong>${teacherName}</strong></td>
      <td>${record.monthYear}</td>
      <td>$${record.baseSalary.toFixed(2)}</td>
      <td><strong>$${record.calculatedPayout.toFixed(2)}</strong></td>
      <td>$${record.paidAmount.toFixed(2)}</td>
      <td style="color: ${record.pendingBalance > 0 ? 'var(--accent-secondary)' : 'inherit'}; font-weight: ${record.pendingBalance > 0 ? '600' : 'normal'};">$${record.pendingBalance.toFixed(2)}</td>
      <td><span class="badge ${statusClass}">${record.status}</span></td>
      <td class="text-right">${actionHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPrincipalStaffDirectory() {
  const tbody = elements.principalStaffList;
  tbody.innerHTML = '';
  
  const teachers = DB.getUsers().filter(u => u.role === 'Teacher');
  
  if (teachers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No teachers registered in the directory.</td></tr>';
    return;
  }
  
  teachers.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.fullName}</strong></td>
      <td><code>${t.username}</code></td>
      <td>$${t.baseSalary.toFixed(2)} / month</td>
      <td class="text-right">
        <button class="btn btn-outline btn-small" onclick="openStaffModal('${t.id}')">Edit</button>
        <button class="btn btn-danger btn-small" onclick="handleDeleteStaff('${t.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Staff Modal Controllers (Synchronous Redraws)
 */
function openStaffModal(userId = '') {
  const form = document.getElementById('staff-form');
  form.reset();
  
  if (userId === '') {
    document.getElementById('staff-user-id').value = '';
    document.getElementById('staff-modal-title').textContent = 'Add New Teacher';
    document.getElementById('staff-password').required = true;
    document.getElementById('staff-password-hint').style.display = 'none';
    document.getElementById('staff-password-label').textContent = 'Personal Password';
  } else {
    const teacher = DB.getUsers().find(u => u.id === userId);
    if (!teacher) return;
    
    document.getElementById('staff-user-id').value = userId;
    document.getElementById('staff-modal-title').textContent = 'Edit Teacher Details';
    document.getElementById('staff-fullname').value = teacher.fullName;
    document.getElementById('staff-username').value = teacher.username;
    
    document.getElementById('staff-password').required = false;
    document.getElementById('staff-password-hint').style.display = 'block';
    document.getElementById('staff-password-label').textContent = 'Change Password';
    
    document.getElementById('staff-base-salary').value = teacher.baseSalary;
  }
  
  openModal('staff-modal');
}

function handleStaffSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('staff-user-id').value;
  const fullName = document.getElementById('staff-fullname').value.trim();
  const username = document.getElementById('staff-username').value.trim();
  const password = document.getElementById('staff-password').value;
  const baseSalary = document.getElementById('staff-base-salary').value;
  
  let res;
  if (userId === '') {
    res = addTeacher(fullName, username, password, baseSalary);
  } else {
    res = updateTeacher(userId, fullName, username, password, baseSalary);
  }
  
  if (res.success) {
    closeModal('staff-modal');
    // Instant DOM Redraws
    setupPrincipalTeacherFilter();
    renderPrincipalStaffDirectory();
    renderPrincipalDashboardView();
  } else {
    alert(res.message);
  }
}

function handleDeleteStaff(userId) {
  const teacher = DB.getUsers().find(u => u.id === userId);
  if (!teacher) return;
  
  if (confirm(`Are you sure you want to delete ${teacher.fullName}? This will also delete all their scheduled lectures, leaves, and payroll records.`)) {
    const res = deleteTeacher(userId);
    if (res.success) {
      // Instant DOM Redraws
      setupPrincipalTeacherFilter();
      renderPrincipalStaffDirectory();
      renderPrincipalDashboardView();
    }
  }
}

/**
 * Principal Decides Timetable: Lecture Modal Controllers (Synchronous Redraws)
 */
function openLectureModal(lectureId = '') {
  const form = document.getElementById('lecture-form');
  form.reset();
  
  const select = document.getElementById('lecture-teacher-select');
  select.innerHTML = '';
  
  const teachers = DB.getUsers().filter(u => u.role === 'Teacher');
  teachers.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.fullName;
    select.appendChild(opt);
  });
  
  if (lectureId === '') {
    document.getElementById('lecture-id').value = '';
    document.getElementById('lecture-modal-title').textContent = 'Schedule Lecture';
    document.getElementById('lecture-teacher-group').style.display = 'block';
  } else {
    const lecture = DB.getTimetable().find(l => l.id === lectureId);
    if (!lecture) return;
    
    document.getElementById('lecture-id').value = lectureId;
    document.getElementById('lecture-modal-title').textContent = 'Modify Lecture Details';
    document.getElementById('lecture-teacher-group').style.display = 'none'; 
    
    document.getElementById('lecture-subject').value = lecture.subject;
    document.getElementById('lecture-class').value = lecture.className;
    document.getElementById('lecture-timeslot').value = lecture.timeSlot;
    document.getElementById('lecture-starttime').value = lecture.startTime;
    document.getElementById('lecture-endtime').value = lecture.endTime;
  }
  
  openModal('lecture-modal');
}

function handleLectureSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('lecture-id').value;
  const subject = document.getElementById('lecture-subject').value.trim();
  const className = document.getElementById('lecture-class').value.trim();
  const timeSlot = document.getElementById('lecture-timeslot').value.trim();
  const startTime = document.getElementById('lecture-starttime').value;
  const endTime = document.getElementById('lecture-endtime').value;
  
  if (startTime >= endTime) {
    alert('Lecture start time must be before end time.');
    return;
  }
  
  let res;
  if (id === '') {
    const userId = document.getElementById('lecture-teacher-select').value;
    res = addLecture(userId, subject, className, timeSlot, startTime, endTime);
  } else {
    res = updateLecture(id, subject, className, timeSlot, startTime, endTime);
  }
  
  if (res.success) {
    closeModal('lecture-modal');
    // Instant DOM Redraws
    renderPrincipalDashboardView();
  } else {
    alert(res.message);
  }
}

function handleDeleteLecture(lectureId) {
  if (confirm('Are you sure you want to remove this lecture from the timetable?')) {
    const res = deleteLecture(lectureId);
    if (res.success) {
      // Instant DOM Redraws
      renderPrincipalDashboardView();
    }
  }
}

/**
 * Principal Operations Decisions
 */
function handleLeaveDecision(leaveId, status) {
  const commentInput = document.getElementById(`comment-${leaveId}`);
  const comment = commentInput ? commentInput.value.trim() : '';
  
  const res = reviewLeave(leaveId, currentSession.id, status, comment);
  if (res.success) {
    // Instant DOM Redraws
    renderPrincipalLeavesInbox();
    renderPrincipalDashboardView();
  }
}

function openPaySalaryModal(recordId) {
  const record = DB.getPayroll().find(r => r.id === recordId);
  const user = DB.getUsers().find(u => u.id === record.userId);
  if (!record || !user) return;
  
  document.getElementById('pay-salary-record-id').value = recordId;
  document.getElementById('pay-salary-name-label').textContent = user.fullName;
  document.getElementById('pay-salary-period-label').textContent = record.monthYear;
  document.getElementById('pay-salary-payout-label').textContent = `$${record.calculatedPayout.toFixed(2)}`;
  document.getElementById('pay-salary-balance-label').textContent = `$${record.pendingBalance.toFixed(2)}`;
  document.getElementById('pay-amount-input').value = record.pendingBalance.toFixed(2);
  
  openModal('pay-salary-modal');
}

function handlePaySalarySubmit(e) {
  e.preventDefault();
  const recordId = document.getElementById('pay-salary-record-id').value;
  const amount = document.getElementById('pay-amount-input').value;
  
  const res = makePayment(recordId, amount);
  if (res.success) {
    closeModal('pay-salary-modal');
    // Instant DOM Redraws
    renderPrincipalPayrollLedger();
    renderPrincipalDashboardView();
  } else {
    alert(res.message);
  }
}

function triggerMonthEndSimulation() {
  elements.payrollReviewBanner.classList.remove('hidden');
  elements.payrollReviewBanner.scrollIntoView({ behavior: 'smooth' });
}

/**
 * =========================================================================
 * GENERAL CONVERSION & MODAL UTILITIES
 * =========================================================================
 */
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function formatTimeFromHours(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHr = h % 12 || 12;
  return `${String(displayHr).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDatePretty(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
