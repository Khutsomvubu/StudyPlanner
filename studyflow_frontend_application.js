/* =========================================================================
       SAFE LOCAL STORAGE HELPER
       ========================================================================= */
    const memoryStore = {};
    const safeStorage = {
      getItem: (key) => {
        try {
          return window.localStorage ? window.localStorage.getItem(key) : (memoryStore[key] || null);
        } catch (e) {
          return memoryStore[key] || null;
        }
      },
      setItem: (key, value) => {
        try {
          if (window.localStorage) {
            window.localStorage.setItem(key, value);
          } else {
            memoryStore[key] = String(value);
          }
        } catch (e) {
          memoryStore[key] = String(value);
        }
      },
      removeItem: (key) => {
        try {
          if (window.localStorage) {
            window.localStorage.removeItem(key);
          } else {
            delete memoryStore[key];
          }
        } catch (e) {
          delete memoryStore[key];
        }
      }
    };

    const REGISTERED_ACCOUNT_KEY = 'sf_registered_account';
    const ASSESSMENT_REMINDER_KEY = 'sf_assessment_reminders';
    const TASK_REMINDER_KEY = 'sf_task_reminders';
    let assessmentReminderTimer = null;
    let taskReminderTimer = null;

    /* =========================================================================
       DEMO STUDENT PROFILE (KHUTSO MODISE)
       ========================================================================= */
    const DEFAULT_USER_PROFILE = {
      id: 'khutso-modise',
      name: 'Khutso Modise',
      email: 'khutso@university.ac.za',
      university: 'Tshwane University of Technology',
      course: 'Diploma in Multimedia Computing',
      year_of_study: '2nd Year',
      target_sleep: 8,
      wake_time: '06:30',
      preferred_study_time: 'Evening',
      default_study_block: 60
    };

    const DEFAULT_MODULES = [
      {
        id: 'mod-1',
        name: 'Programming A',
        code: 'PPAF05D',
        lecturer: 'Dr. Van Der Merwe',
        current_mark: 68,
        target_mark: 75,
        difficulty: 'Hard',
        notes: 'Covers Object-Oriented Programming and Data Structures.'
      },
      {
        id: 'mod-2',
        name: 'Computational Mathematics',
        code: 'CMAT02A',
        lecturer: 'Prof. Mokoena',
        current_mark: 61,
        target_mark: 75,
        difficulty: 'Hard',
        notes: 'Discrete mathematics, linear algebra, boolean logic.'
      },
      {
        id: 'mod-3',
        name: 'Computer Fundamentals',
        code: 'CFUN01B',
        lecturer: 'Mr. Nkosi',
        current_mark: 78,
        target_mark: 80,
        difficulty: 'Medium',
        notes: 'Computer hardware architecture, logic gates, operating systems.'
      },
      {
        id: 'mod-4',
        name: 'Communication for Academic Purposes',
        code: 'CAPF01D',
        lecturer: 'Ms. Smith',
        current_mark: 82,
        target_mark: 85,
        difficulty: 'Easy',
        notes: 'Technical reporting, academic writing and presentation skills.'
      }
    ];

    function getTodayDateString() {
      const d = new Date();
      return d.toISOString().split('T')[0];
    }

    function getOffsetDateString(offsetDays) {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    }

    function formatDateDisplay(dateStr) {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function getDayNameFromDate(dateStr) {
      if (!dateStr) return 'Monday';
      const [y, m, d] = dateStr.split('-');
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    const DEFAULT_ASSESSMENTS = [
      {
        id: 'ass-1',
        module_id: 'mod-1',
        name: 'Programming Assignment 2 (Data Structures)',
        type: 'Assignment',
        due_date: getOffsetDateString(2),
        due_time: '23:59',
        weight: 15,
        description: 'Binary search tree and linked list implementation.',
        status: 'In progress'
      },
      {
        id: 'ass-2',
        module_id: 'mod-2',
        name: 'Computational Mathematics Semester Test',
        type: 'Test',
        due_date: getOffsetDateString(5),
        due_time: '09:00',
        weight: 25,
        description: 'Matrix algebra, truth tables, boolean minimization.',
        status: 'Not started'
      },
      {
        id: 'ass-3',
        module_id: 'mod-3',
        name: 'Computer Fundamentals Practical Project',
        type: 'Project',
        due_date: getOffsetDateString(9),
        due_time: '17:00',
        weight: 20,
        description: 'Assembly simulated pipeline instructions.',
        status: 'Not started'
      }
    ];

    const DEFAULT_TIMETABLE = [
      { id: 'tt-1', module_id: 'mod-1', day: 'Monday', start_time: '08:00', end_time: '10:00', location: 'Lab 3B' },
      { id: 'tt-2', module_id: 'mod-2', day: 'Monday', start_time: '14:00', end_time: '16:00', location: 'Lecture Hall 1' },
      { id: 'tt-3', module_id: 'mod-3', day: 'Tuesday', start_time: '10:00', end_time: '12:00', location: 'Hall 4' },
      { id: 'tt-4', module_id: 'mod-4', day: 'Wednesday', start_time: '09:00', end_time: '11:00', location: 'Online Teams' },
      { id: 'tt-5', module_id: 'mod-1', day: 'Thursday', start_time: '08:00', end_time: '10:00', location: 'Lab 3B' },
      { id: 'tt-6', module_id: 'mod-3', day: 'Thursday', start_time: '14:00', end_time: '15:00', location: 'Hall 4' },
      { id: 'tt-7', module_id: 'mod-2', day: 'Friday', start_time: '11:00', end_time: '13:00', location: 'Hall 1' }
    ];

    const DEFAULT_TASKS = [
      { id: 'tsk-1', module_id: 'mod-1', title: 'Implement Binary Tree Node structure', date: getTodayDateString(), start_time: '19:00', end_time: '20:30', priority: 'High', completed: true },
      { id: 'tsk-2', module_id: 'mod-2', title: 'Mathematics revision exercises 4.1 & 4.2', date: getTodayDateString(), start_time: '10:30', end_time: '11:30', priority: 'High', completed: true },
      { id: 'tsk-3', module_id: 'mod-3', title: 'Review lecture slides on CPU Cache hierarchy', date: getTodayDateString(), start_time: '16:00', end_time: '17:00', priority: 'Medium', completed: false },
      { id: 'tsk-4', module_id: 'mod-4', title: 'Proofread academic essay bibliography', date: getTodayDateString(), start_time: '21:00', end_time: '21:30', priority: 'Low', completed: false }
    ];

    const DEFAULT_STUDY_SESSIONS = [
      { id: 'ss-1', module_id: 'mod-1', date: getTodayDateString(), start_time: '19:00', end_time: '20:00', duration: 60, completed: false },
      { id: 'ss-2', module_id: 'mod-2', date: getTodayDateString(), start_time: '10:30', end_time: '11:30', duration: 60, completed: true },
      { id: 'ss-3', module_id: 'mod-2', date: getOffsetDateString(1), start_time: '18:00', end_time: '19:30', duration: 90, completed: false },
      { id: 'ss-4', module_id: 'mod-1', date: getOffsetDateString(2), start_time: '19:00', end_time: '20:00', duration: 60, completed: false }
    ];

    const DEFAULT_SLEEP_RECORDS = [
      { id: 'slp-1', date: getOffsetDateString(-1), bedtime: '23:00', wake_time: '06:30', duration: 7.5 },
      { id: 'slp-2', date: getOffsetDateString(-2), bedtime: '23:15', wake_time: '06:45', duration: 7.5 },
      { id: 'slp-3', date: getOffsetDateString(-3), bedtime: '22:45', wake_time: '06:15', duration: 7.5 },
      { id: 'slp-4', date: getOffsetDateString(-4), bedtime: '00:00', wake_time: '07:00', duration: 7.0 },
      { id: 'slp-5', date: getOffsetDateString(-5), bedtime: '22:30', wake_time: '06:30', duration: 8.0 }
    ];

    window.StudyFlow = {
      currentUser: null,
      isDemoUser: true,
      modules: [],
      assessments: [],
      timetable: [],
      tasks: [],
      studySessions: [],
      sleepRecords: [],
      activeTimetableDay: 'Monday'
    };

    window.showToast = function(message, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      
      const isSuccess = type === 'success';
      const isWarning = type === 'warning';
      const bg = isSuccess ? 'bg-emerald-600 text-white' : (isWarning ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white');
      const icon = isSuccess ? 'check-circle' : (isWarning ? 'alert-triangle' : 'alert-octagon');

      toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold ${bg} pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300`;
      toast.innerHTML = `
        <i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i>
        <span>${message}</span>
      `;
      container.appendChild(toast);
      lucide.createIcons();

      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      });

      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3200);
    };

    window.openModal = function({ title, subtitle = '', bodyHtml, confirmText = 'Confirm', confirmClass = 'bg-indigo-600 hover:bg-indigo-700', onConfirm }) {
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-subtitle').textContent = subtitle;
      document.getElementById('modal-body').innerHTML = bodyHtml;
      
      const confirmBtn = document.getElementById('modal-confirm-btn');
      confirmBtn.textContent = confirmText;
      confirmBtn.className = `px-4 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition ${confirmClass}`;
      
      confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        closeModal();
      };

      const container = document.getElementById('modal-container');
      container.classList.remove('hidden');
      container.classList.add('flex');
      lucide.createIcons();
    };

    window.closeModal = function() {
      const container = document.getElementById('modal-container');
      container.classList.add('hidden');
      container.classList.remove('flex');
    };

    window.navigate = function(pageId) {
      document.querySelectorAll('.page-container').forEach(p => p.classList.add('hidden'));
      const target = document.getElementById(`page-${pageId}`);
      if (target) {
        target.classList.remove('hidden');
        target.classList.add('view-content');
      }

      document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.dataset.page === pageId) {
          btn.className = "nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50";
        } else {
          btn.className = "nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
        }
      });

      document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        if (btn.dataset.page === pageId) {
          btn.classList.add('text-indigo-600', 'dark:text-indigo-400');
          btn.classList.remove('text-slate-500', 'dark:text-slate-400');
        } else {
          btn.classList.remove('text-indigo-600', 'dark:text-indigo-400');
          btn.classList.add('text-slate-500', 'dark:text-slate-400');
        }
      });

      if (pageId === 'analytics') {
        renderCharts();
      }
      lucide.createIcons();
    };

    window.toggleDarkMode = function() {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        document.body.classList.remove('dark');
        safeStorage.setItem('sf_theme', 'light');
      } else {
        html.classList.add('dark');
        document.body.classList.add('dark');
        safeStorage.setItem('sf_theme', 'dark');
      }
      lucide.createIcons();
      if (!document.getElementById('page-analytics').classList.contains('hidden')) {
        renderCharts();
      }
    };

    try {
      if (safeStorage.getItem('sf_theme') === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
    } catch (e) {}

    window.switchAuthTab = function(tab) {
      const loginForm = document.getElementById('form-login');
      const signupForm = document.getElementById('form-signup');
      const tabLogin = document.getElementById('tab-login');
      const tabSignup = document.getElementById('tab-signup');

      if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabLogin.className = "flex-1 pb-3 text-sm font-semibold border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400";
        tabSignup.className = "flex-1 pb-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 border-b-2 border-transparent";
      } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        tabSignup.className = "flex-1 pb-3 text-sm font-semibold border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400";
        tabLogin.className = "flex-1 pb-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 border-b-2 border-transparent";
      }
      lucide.createIcons();
    };

    window.handleLogin = function(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-password').value;

      if (!email || !pass) {
        showToast("Please enter your email and password.", "error");
        return;
      }

      const registeredAccount = getRegisteredAccount();
      if (registeredAccount && email !== DEFAULT_USER_PROFILE.email) {
        if (registeredAccount.email !== email || registeredAccount.password !== pass) {
          showToast("The email or password is incorrect.", "error");
          return;
        }
        window.StudyFlow.isDemoUser = false;
        window.StudyFlow.currentUser = registeredAccount.profile;
        restoreRegisteredUserData(registeredAccount);
        showToast("Welcome back, " + registeredAccount.profile.name + "!", "success");
        completeAuthTransition(email, registeredAccount.profile.name);
        return;
      }

      window.StudyFlow.isDemoUser = true;
      showToast("Logging into StudyFlow...", "success");
      completeAuthTransition(email);
    };

    window.loginDemoUser = function() {
      window.StudyFlow.isDemoUser = true;
      showToast("Signed in as Khutso Modise (Demo Student)", "success");
      completeAuthTransition('khutso@university.ac.za', 'Khutso Modise');
    };

    window.handleSignup = function(e) {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const pass = document.getElementById('signup-password').value;
      const conf = document.getElementById('signup-confirm').value;
      const uni = document.getElementById('signup-uni').value.trim();
      const course = document.getElementById('signup-course').value.trim();
      const year = document.getElementById('signup-year').value;

      if (pass !== conf) {
        showToast("Passwords do not match.", "error");
        return;
      }

      if (!isPasswordStrongEnough(pass)) {
        showToast("Password must be at least 8 characters and include uppercase, lowercase, a digit, and a special character.", "error");
        return;
      }

      const registeredAccount = getRegisteredAccount();
      const normalizedEmail = email.toLowerCase();
      if (normalizedEmail === DEFAULT_USER_PROFILE.email.toLowerCase() ||
        (registeredAccount && registeredAccount.email.toLowerCase() === normalizedEmail)) {
        showToast("This email is already registered. Please use a different email address.", "error");
        return;
      }

      if (registeredAccount && registeredAccount.password === pass) {
        showToast("That password is already in use. Please choose a different password.", "error");
        return;
      }

      window.StudyFlow.isDemoUser = false;
      window.StudyFlow.currentUser = {
        id: 'usr-' + Date.now(),
        name, email: normalizedEmail, university: uni, course, year_of_study: year,
        target_sleep: 8, wake_time: '06:30', preferred_study_time: 'Evening', default_study_block: 60
      };

      initializeNewUserData();
      saveRegisteredAccount(pass);
      showToast("Welcome to StudyFlow, " + name + "!", "success");
      completeAuthTransition(email, name);
    };

    window.handleForgotPassword = function() {
      openModal({
        title: "Reset Student Password",
        subtitle: "Account Recovery",
        bodyHtml: `
          <p class="text-sm text-slate-600 dark:text-slate-400 mb-3">Enter your student institution email to receive a password reset link.</p>
          <input type="email" class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none" value="khutso@university.ac.za">
        `,
        confirmText: "Send Reset Link",
        onConfirm: () => showToast("Password reset link sent to your student email.")
      });
    };

    window.completeAuthTransition = function(email, name = 'Khutso Modise') {
      document.getElementById('auth-view').classList.add('hidden');
      document.getElementById('app-view').classList.remove('hidden');
      if (window.StudyFlow.isDemoUser) {
        seedMemoryDefaults();
      }
      updateUserUI();
      renderAllViews();
      navigate('dashboard');
      startAssessmentReminderService();
    };

    window.handleLogout = function() {
      openModal({
        title: "Log Out of StudyFlow?",
        subtitle: "Session Management",
        bodyHtml: "Are you sure you want to end your student planning session?",
        confirmText: "Yes, Log Out",
        confirmClass: "bg-rose-600 hover:bg-rose-700",
        onConfirm: () => {
          document.getElementById('app-view').classList.add('hidden');
          document.getElementById('auth-view').classList.remove('hidden');
          showToast("Logged out successfully.");
        }
      });
    };

    function seedMemoryDefaults() {
      window.StudyFlow.isDemoUser = true;
      window.StudyFlow.currentUser = { ...DEFAULT_USER_PROFILE };
      window.StudyFlow.modules = JSON.parse(JSON.stringify(DEFAULT_MODULES));
      window.StudyFlow.assessments = JSON.parse(JSON.stringify(DEFAULT_ASSESSMENTS));
      window.StudyFlow.timetable = JSON.parse(JSON.stringify(DEFAULT_TIMETABLE));
      window.StudyFlow.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      window.StudyFlow.studySessions = JSON.parse(JSON.stringify(DEFAULT_STUDY_SESSIONS));
      window.StudyFlow.sleepRecords = JSON.parse(JSON.stringify(DEFAULT_SLEEP_RECORDS));
    }

    function initializeNewUserData() {
      window.StudyFlow.modules = [];
      window.StudyFlow.assessments = [];
      window.StudyFlow.timetable = [];
      window.StudyFlow.tasks = [];
      window.StudyFlow.studySessions = [];
      window.StudyFlow.sleepRecords = [];
    }

    function getRegisteredAccount() {
      const storedAccount = safeStorage.getItem(REGISTERED_ACCOUNT_KEY);
      if (!storedAccount) return null;

      try {
        return JSON.parse(storedAccount);
      } catch (error) {
        safeStorage.removeItem(REGISTERED_ACCOUNT_KEY);
        return null;
      }
    }

    function isPasswordStrongEnough(password) {
      return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);
    }

    function saveRegisteredAccount(password) {
      safeStorage.setItem(REGISTERED_ACCOUNT_KEY, JSON.stringify({
        email: window.StudyFlow.currentUser.email,
        password,
        profile: window.StudyFlow.currentUser,
        modules: window.StudyFlow.modules,
        assessments: window.StudyFlow.assessments,
        timetable: window.StudyFlow.timetable,
        tasks: window.StudyFlow.tasks,
        studySessions: window.StudyFlow.studySessions,
        sleepRecords: window.StudyFlow.sleepRecords
      }));
    }

    function persistCurrentUserData() {
      const account = getRegisteredAccount();
      if (!window.StudyFlow.isDemoUser && account && window.StudyFlow.currentUser) {
        saveRegisteredAccount(account.password);
      }
    }

    function restoreRegisteredUserData(account) {
      window.StudyFlow.modules = account.modules || [];
      window.StudyFlow.assessments = account.assessments || [];
      window.StudyFlow.timetable = account.timetable || [];
      window.StudyFlow.tasks = account.tasks || [];
      window.StudyFlow.studySessions = account.studySessions || [];
      window.StudyFlow.sleepRecords = account.sleepRecords || [];
    }

    function getAssessmentDueDate(assessment) {
      if (!assessment.due_date) return null;
      const dueTime = assessment.due_time || '23:59';
      const dueDate = new Date(`${assessment.due_date}T${dueTime}:00`);
      return Number.isNaN(dueDate.getTime()) ? null : dueDate;
    }

    function getSentAssessmentReminders() {
      const storedReminders = safeStorage.getItem(ASSESSMENT_REMINDER_KEY);
      if (!storedReminders) return {};

      try {
        return JSON.parse(storedReminders);
      } catch (error) {
        safeStorage.removeItem(ASSESSMENT_REMINDER_KEY);
        return {};
      }
    }

    function startAssessmentReminderService() {
      if (assessmentReminderTimer) {
        window.clearInterval(assessmentReminderTimer);
      }
      if (taskReminderTimer) {
        window.clearInterval(taskReminderTimer);
      }

      requestAssessmentNotificationPermission();
      checkForAssessmentReminders();
      checkForTaskReminders();
      assessmentReminderTimer = window.setInterval(checkForAssessmentReminders, 60 * 1000);
      taskReminderTimer = window.setInterval(checkForTaskReminders, 60 * 1000);
    }

    function requestAssessmentNotificationPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    function checkForAssessmentReminders() {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const moduleIds = new Set(window.StudyFlow.modules.map(module => module.id));
      const sentReminders = getSentAssessmentReminders();
      let remindersChanged = false;

      window.StudyFlow.assessments
        .filter(assessment => assessment.status !== 'Completed' && moduleIds.has(assessment.module_id))
        .forEach(assessment => {
          const dueDate = getAssessmentDueDate(assessment);
          if (!dueDate || dueDate <= now || dueDate > twelveHoursFromNow) return;

          const reminderId = `${assessment.id}:${dueDate.toISOString()}`;
          if (sentReminders[reminderId]) return;

          const module = window.StudyFlow.modules.find(item => item.id === assessment.module_id);
          new Notification(`Assessment due soon: ${assessment.name}`, {
            body: `${module ? module.name + ' • ' : ''}Due ${formatDateDisplay(assessment.due_date)} at ${assessment.due_time || '23:59'}.`,
            tag: reminderId
          });
          sentReminders[reminderId] = true;
          remindersChanged = true;
        });

      if (remindersChanged) {
        safeStorage.setItem(ASSESSMENT_REMINDER_KEY, JSON.stringify(sentReminders));
      }
    }

    function getSentTaskReminders() {
      const storedReminders = safeStorage.getItem(TASK_REMINDER_KEY);
      if (!storedReminders) return {};

      try {
        return JSON.parse(storedReminders);
      } catch (error) {
        safeStorage.removeItem(TASK_REMINDER_KEY);
        return {};
      }
    }

    function checkForTaskReminders() {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const reminderWindowStart = new Date(now.getTime() - 15 * 60 * 1000);
      const sentReminders = getSentTaskReminders();
      let remindersChanged = false;

      window.StudyFlow.tasks
        .filter(task => !task.completed && task.date && task.start_time)
        .forEach(task => {
          const taskDate = new Date(`${task.date}T${task.start_time}:00`);
          if (Number.isNaN(taskDate.getTime()) || taskDate < reminderWindowStart || taskDate > now) return;

          const reminderId = `${task.id}:${taskDate.toISOString()}`;
          if (sentReminders[reminderId]) return;

          const module = window.StudyFlow.modules.find(item => item.id === task.module_id);
          new Notification(`Task reminder: ${task.title}`, {
            body: `${module ? module.name + ' • ' : ''}Your task was scheduled for ${task.start_time}.`,
            tag: reminderId
          });
          sentReminders[reminderId] = true;
          remindersChanged = true;
        });

      if (remindersChanged) {
        safeStorage.setItem(TASK_REMINDER_KEY, JSON.stringify(sentReminders));
      }
    }

    function updateUserUI() {
      const user = window.StudyFlow.currentUser || DEFAULT_USER_PROFILE;
      document.getElementById('dash-greeting').textContent = `Good day, ${user.name.split(' ')[0]} 👋`;
      document.getElementById('user-sidebar-name').textContent = user.name;
      document.getElementById('user-sidebar-course').textContent = user.course;

      const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      document.getElementById('user-avatar-initials').textContent = initials;

      document.getElementById('set-name').value = user.name;
      document.getElementById('set-email').value = user.email;
      document.getElementById('set-uni').value = user.university;
      document.getElementById('set-course').value = user.course;
      document.getElementById('set-sleep-hours').value = user.target_sleep || 8;
      document.getElementById('set-wake-time').value = user.wake_time || '06:30';
      document.getElementById('set-study-block').value = user.default_study_block || 60;

      document.getElementById('sleep-card-wake').textContent = user.wake_time || '06:30';
      const [h, m] = (user.wake_time || '06:30').split(':').map(Number);
      const wakeMinutes = h * 60 + m;
      let bedMinutes = wakeMinutes - (user.target_sleep || 8) * 60;
      if (bedMinutes < 0) bedMinutes += 24 * 60;
      const bedH = String(Math.floor(bedMinutes / 60)).padStart(2, '0');
      const bedM = String(bedMinutes % 60).padStart(2, '0');
      document.getElementById('sleep-card-bedtime').textContent = `${bedH}:${bedM}`;
    }

    function renderDashboard() {
      const { modules, assessments, tasks, studySessions, sleepRecords } = window.StudyFlow;

      const avg = modules.length > 0
        ? Math.round(modules.reduce((sum, m) => sum + (Number(m.current_mark) || 0), 0) / modules.length)
        : 0;
      document.getElementById('dash-stat-average').textContent = `${avg}%`;
      document.getElementById('dash-stat-modules').textContent = modules.length;
      document.getElementById('analytics-avg-mark').textContent = `${avg}%`;

      const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 };
      const hardestModule = modules.reduce((hardest, module) => {
        if (!hardest || (difficultyRank[module.difficulty] || 0) > (difficultyRank[hardest.difficulty] || 0)) {
          return module;
        }
        return hardest;
      }, null);
      document.getElementById('analytics-hardest-module').textContent =
        hardestModule ? hardestModule.name : 'No modules selected';

      const moduleIds = new Set(modules.map(module => module.id));
      const completedStudySessions = studySessions.filter(session =>
        session.completed && moduleIds.has(session.module_id)
      ).length;
      document.getElementById('analytics-completed-sessions').textContent =
        `${completedStudySessions} session${completedStudySessions === 1 ? '' : 's'}`;

      const activeAssessments = assessments.filter(a => a.status !== 'Completed');
      document.getElementById('dash-stat-deadlines').textContent = activeAssessments.length;
      document.getElementById('badge-assessments-count').textContent = activeAssessments.length;
      document.getElementById('analytics-deadlines-left').textContent = `${activeAssessments.length} assessments`;

      const todayTasks = tasks;
      const completedTasks = todayTasks.filter(t => t.completed).length;
      const dailyPercent = todayTasks.length > 0 ? Math.round((completedTasks / todayTasks.length) * 100) : 0;
      document.getElementById('dash-stat-daily').textContent = `${dailyPercent}%`;
      document.getElementById('dash-stat-daily-count').textContent = `${completedTasks} of ${todayTasks.length}`;
      document.getElementById('planner-progress-text').textContent = `${dailyPercent}%`;
      document.getElementById('planner-tasks-ratio').textContent = `${completedTasks} of ${todayTasks.length} Completed`;
      document.getElementById('planner-progress-bar').style.width = `${dailyPercent}%`;

      const lastSleep = sleepRecords[0];
      if (lastSleep) {
        const h = Math.floor(lastSleep.duration);
        const m = Math.round((lastSleep.duration - h) * 60);
        document.getElementById('dash-stat-sleep').textContent = `${h}h ${m > 0 ? m + 'm' : ''}`;
      }

      let lowestModule = null;
      let maxGap = -999;
      modules.forEach(m => {
        const gap = (Number(m.target_mark) || 75) - (Number(m.current_mark) || 0);
        if (gap > maxGap) {
          maxGap = gap;
          lowestModule = m;
        }
      });

      const recCard = document.getElementById('dash-recommendation-card');
      const recText = document.getElementById('dash-recommendation-text');
      if (lowestModule && maxGap > 0) {
        recCard.classList.remove('hidden');
        recText.innerHTML = `Spend more study time on <strong>${lowestModule.name}</strong> this week because your current mark (${lowestModule.current_mark}%) is ${maxGap}% below your target (${lowestModule.target_mark}%).`;
      } else if (activeAssessments.length > 0) {
        const nextAss = activeAssessments[0];
        recCard.classList.remove('hidden');
        const mod = modules.find(m => m.id === nextAss.module_id);
        recText.innerHTML = `Upcoming deadline alert: Prepare for <strong>${nextAss.name}</strong> (${mod ? mod.name : 'Module'}), due on ${formatDateDisplay(nextAss.due_date)}.`;
      } else {
        recCard.classList.add('hidden');
      }

      renderDashboardTodaySchedule();
      renderDashboardDeadlines();
      renderDashboardModuleBars();
    }

    function renderDashboardTodaySchedule() {
      const container = document.getElementById('dash-schedule-list');
      container.innerHTML = '';
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = dayNames[new Date().getDay()];
      document.getElementById('dash-schedule-day-tag').textContent = todayDay;

      const todayClasses = window.StudyFlow.timetable
        .filter(t => t.day.toLowerCase() === todayDay.toLowerCase())
        .map(t => {
          const mod = window.StudyFlow.modules.find(m => m.id === t.module_id);
          return {
            type: 'Class',
            title: mod ? mod.name : 'Lecture Class',
            subtitle: `${t.location} • Lecture/Tutorial`,
            start: t.start_time, end: t.end_time,
            completed: false, id: t.id
          };
        });

      const todayTasksList = window.StudyFlow.tasks.map(tsk => {
        const mod = window.StudyFlow.modules.find(m => m.id === tsk.module_id);
        return {
          type: 'Task',
          title: tsk.title,
          subtitle: mod ? mod.name : 'Self Study',
          start: tsk.start_time || '18:00', end: tsk.end_time || '19:00',
          completed: tsk.completed, id: tsk.id, isTask: true
        };
      });

      const allItems = [...todayClasses, ...todayTasksList].sort((a, b) => a.start.localeCompare(b.start));

      if (allItems.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
            <i data-lucide="calendar-check" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs font-semibold">No scheduled classes or tasks for today.</p>
            <button onclick="navigate('daily')" class="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Add a task</button>
          </div>
        `;
        return;
      }

      allItems.forEach(item => {
        const row = document.createElement('div');
        const isClass = item.type === 'Class';
        row.className = `flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm ${item.completed ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : ''}`;
        row.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${isClass ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'} shrink-0">
              ${item.start} – ${item.end}
            </span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate ${item.completed ? 'line-through text-slate-400' : ''}">${item.title}</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">${item.subtitle}</p>
            </div>
          </div>
          <div>
            ${item.isTask ? `
              <button onclick="toggleTaskCompletion('${item.id}')" class="p-1.5 rounded-lg border ${item.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700 text-transparent hover:border-indigo-500'} transition">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
            ` : `
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Class</span>
            `}
          </div>
        `;
        container.appendChild(row);
      });
    }

    function renderDashboardDeadlines() {
      const container = document.getElementById('dash-deadlines-list');
      container.innerHTML = '';
      const sorted = [...window.StudyFlow.assessments]
        .filter(a => a.status !== 'Completed')
        .sort((a, b) => (a.due_date + a.due_time).localeCompare(b.due_date + b.due_time))
        .slice(0, 5);

      if (sorted.length === 0) {
        container.innerHTML = `
          <div class="p-5 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
            <i data-lucide="party-popper" class="w-6 h-6 mx-auto mb-1 text-emerald-500"></i>
            <span>No pending deadlines! All assessments are up to date.</span>
          </div>
        `;
        return;
      }

      sorted.forEach(ass => {
        const mod = window.StudyFlow.modules.find(m => m.id === ass.module_id);
        const daysLeft = calculateDaysUntil(ass.due_date);
        
        let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        let badgeText = `🟢 In ${daysLeft} days`;
        if (daysLeft < 0) {
          badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
          badgeText = 'Past Due';
        } else if (daysLeft === 0) {
          badgeColor = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 animate-pulse';
          badgeText = '🔴 Due Today!';
        } else if (daysLeft === 1) {
          badgeColor = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
          badgeText = '🔴 Due Tomorrow';
        } else if (daysLeft <= 3) {
          badgeColor = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
          badgeText = `🟠 Due in ${daysLeft} days`;
        }

        const card = document.createElement('div');
        card.className = "p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm gap-2";
        card.innerHTML = `
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${ass.type}</span>
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate">${ass.name}</p>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">${mod ? mod.name : 'Course'} • ${ass.weight}% Weight</p>
          </div>
          <span class="text-[11px] font-bold px-2.5 py-1 rounded-xl border shrink-0 ${badgeColor}">
            ${badgeText}
          </span>
        `;
        container.appendChild(card);
      });
    }

    function renderDashboardModuleBars() {
      const container = document.getElementById('dash-modules-progress');
      container.innerHTML = '';
      window.StudyFlow.modules.forEach(mod => {
        const mark = Number(mod.current_mark) || 0;
        const target = Number(mod.target_mark) || 75;
        const isGood = mark >= target;

        const row = document.createElement('div');
        row.className = "space-y-1";
        row.innerHTML = `
          <div class="flex justify-between items-center text-xs">
            <span class="font-semibold text-slate-800 dark:text-slate-200">${mod.name}</span>
            <div class="flex items-center gap-2 font-mono">
              <span class="font-bold ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">${mark}%</span>
              <span class="text-[10px] text-slate-400">/ ${target}% target</span>
            </div>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
            <div class="h-2 rounded-full ${isGood ? 'bg-emerald-500' : 'bg-amber-500'} transition-all duration-500" style="width: ${Math.min(mark, 100)}%"></div>
          </div>
        `;
        container.appendChild(row);
      });
    }

    function calculateDaysUntil(dateStr) {
      if (!dateStr) return 99;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [y, m, d] = dateStr.split('-');
      const target = new Date(y, m - 1, d);
      target.setHours(0, 0, 0, 0);
      const diffTime = target - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    window.renderModules = function() {
      const container = document.getElementById('modules-grid');
      container.innerHTML = '';
      window.StudyFlow.modules.forEach(mod => {
        const mark = Number(mod.current_mark) || 0;
        const target = Number(mod.target_mark) || 75;
        const diffColor = mod.difficulty === 'Hard' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200' : (mod.difficulty === 'Medium' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200');

        const card = document.createElement('div');
        card.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition";
        card.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">${mod.code}</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white mt-1">${mod.name}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Lecturer: ${mod.lecturer || 'Department Staff'}</p>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="editModule('${mod.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition" title="Edit module">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="confirmDeleteModule('${mod.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition" title="Delete module">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Current Mark</span>
              <span class="font-extrabold text-sm text-slate-900 dark:text-white">${mark}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Target</span>
              <span class="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">${target}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Difficulty</span>
              <span class="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColor}">${mod.difficulty}</span>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs text-slate-500 mb-1">
              <span>Goal Progress</span>
              <span>${mark >= target ? 'On Target' : `${target - mark}% below target`}</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full ${mark >= target ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${Math.min(mark, 100)}%"></div>
            </div>
          </div>

          ${mod.notes ? `<p class="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl line-clamp-2">${mod.notes}</p>` : ''}
        `;
        container.appendChild(card);
      });
      lucide.createIcons();
    };

    window.openModuleModal = function(existingModule = null) {
      const isEdit = Boolean(existingModule);
      openModal({
        title: isEdit ? "Edit Academic Module" : "Add New Module",
        subtitle: isEdit ? existingModule.code : "Course Catalog",
        bodyHtml: `
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1">Module Name</label>
              <input type="text" id="m-name" required value="${existingModule ? existingModule.name : ''}" placeholder="e.g. Programming A" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Module Code</label>
                <input type="text" id="m-code" required value="${existingModule ? existingModule.code : ''}" placeholder="e.g. PPAF05D" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none uppercase">
              </div>
              <div>
                <label class="block font-semibold mb-1">Lecturer Name</label>
                <input type="text" id="m-lecturer" value="${existingModule ? existingModule.lecturer : ''}" placeholder="e.g. Dr. Van Der Merwe" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-semibold mb-1">Current Mark %</label>
                <input type="number" id="m-current" min="0" max="100" value="${existingModule ? existingModule.current_mark : '70'}" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
              <div>
                <label class="block font-semibold mb-1">Target Mark %</label>
                <input type="number" id="m-target" min="0" max="100" value="${existingModule ? existingModule.target_mark : '75'}" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
              <div>
                <label class="block font-semibold mb-1">Difficulty</label>
                <select id="m-difficulty" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
                  <option value="Easy" ${existingModule && existingModule.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                  <option value="Medium" ${existingModule && existingModule.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                  <option value="Hard" ${existingModule && existingModule.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-semibold mb-1">Notes / Syllabus Focus</label>
              <textarea id="m-notes" rows="2" placeholder="Course outline, test requirements..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">${existingModule ? (existingModule.notes || '') : ''}</textarea>
            </div>
          </div>
        `,
        confirmText: isEdit ? "Update Module" : "Save Module",
        onConfirm: () => {
          const name = document.getElementById('m-name').value.trim();
          const code = document.getElementById('m-code').value.trim().toUpperCase();
          if (!name || !code) {
            showToast("Module name and code are required.", "error");
            return;
          }

          const moduleData = {
            id: isEdit ? existingModule.id : ('mod-' + Date.now()),
            name, code,
            lecturer: document.getElementById('m-lecturer').value.trim(),
            current_mark: Number(document.getElementById('m-current').value) || 0,
            target_mark: Number(document.getElementById('m-target').value) || 75,
            difficulty: document.getElementById('m-difficulty').value,
            notes: document.getElementById('m-notes').value.trim()
          };

          if (isEdit) {
            const idx = window.StudyFlow.modules.findIndex(m => m.id === existingModule.id);
            if (idx !== -1) window.StudyFlow.modules[idx] = moduleData;
          } else {
            window.StudyFlow.modules.push(moduleData);
          }

          showToast(isEdit ? "Module updated successfully." : "Module added successfully.");
          renderAllViews();
        }
      });
    };

    window.editModule = function(id) {
      const mod = window.StudyFlow.modules.find(m => m.id === id);
      if (mod) openModuleModal(mod);
    };

    window.confirmDeleteModule = function(id) {
      const mod = window.StudyFlow.modules.find(m => m.id === id);
      openModal({
        title: "Delete Module?",
        subtitle: mod ? mod.name : 'Module Removal',
        bodyHtml: `Are you sure you want to remove <strong>${mod ? mod.code : 'this module'}</strong>?`,
        confirmText: "Yes, Delete",
        confirmClass: "bg-rose-600 hover:bg-rose-700",
        onConfirm: () => {
          window.StudyFlow.modules = window.StudyFlow.modules.filter(m => m.id !== id);
          showToast("Module removed.");
          renderAllViews();
        }
      });
    };

    window.renderAssessments = function() {
      const container = document.getElementById('assessments-list');
      container.innerHTML = '';
      const filterStatus = document.getElementById('assessment-filter-status').value;
      let list = [...window.StudyFlow.assessments];
      if (filterStatus !== 'ALL') {
        list = list.filter(a => a.status === filterStatus);
      }
      list.sort((a, b) => (a.due_date + a.due_time).localeCompare(b.due_date + b.due_time));

      list.forEach(ass => {
        const mod = window.StudyFlow.modules.find(m => m.id === ass.module_id);
        const days = calculateDaysUntil(ass.due_date);

        let countdownBadge = `🟢 Due in ${days} days`;
        let badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400';
        if (days < 0) {
          countdownBadge = 'Past Due';
          badgeClass = 'text-slate-600 bg-slate-100 border-slate-200';
        } else if (days === 0) {
          countdownBadge = '🔴 Due Today';
          badgeClass = 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 animate-pulse';
        } else if (days === 1) {
          countdownBadge = '🔴 Due Tomorrow';
          badgeClass = 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400';
        } else if (days <= 3) {
          countdownBadge = `🟠 Due in ${days} days`;
          badgeClass = 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400';
        }

        const card = document.createElement('div');
        card.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition";
        card.innerHTML = `
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">${ass.type}</span>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white truncate">${ass.name}</h3>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}">${countdownBadge}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              ${mod ? `<strong class="text-slate-700 dark:text-slate-300">${mod.name}</strong> • ` : ''}
              Weight: ${ass.weight}% • Due: ${formatDateDisplay(ass.due_date)} at ${ass.due_time}
            </p>
            ${ass.description ? `<p class="text-xs text-slate-600 dark:text-slate-400 pt-1">${ass.description}</p>` : ''}
          </div>

          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <select onchange="updateAssessmentStatus('${ass.id}', this.value)" class="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              <option value="Not started" ${ass.status === 'Not started' ? 'selected' : ''}>Not started</option>
              <option value="In progress" ${ass.status === 'In progress' ? 'selected' : ''}>In progress</option>
              <option value="Completed" ${ass.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button onclick="editAssessment('${ass.id}')" class="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition" title="Edit">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="confirmDeleteAssessment('${ass.id}')" class="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;
        container.appendChild(card);
      });
      lucide.createIcons();
    };

    window.openAssessmentModal = function(existing = null) {
      const isEdit = Boolean(existing);
      const modulesOptions = window.StudyFlow.modules.map(m => `
        <option value="${m.id}" ${existing && existing.module_id === m.id ? 'selected' : ''}>${m.code} — ${m.name}</option>
      `).join('');

      openModal({
        title: isEdit ? "Edit Assessment" : "Add Academic Assessment",
        subtitle: "Deadline & Weight Configuration",
        bodyHtml: `
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1">Assessment Name / Title</label>
              <input type="text" id="a-name" required value="${existing ? existing.name : ''}" placeholder="e.g. Semester Test 1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Assigned Module</label>
                <select id="a-module" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
                  ${modulesOptions}
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Assessment Type</label>
                <select id="a-type" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
                  <option value="Assignment">Assignment</option>
                  <option value="Test">Test</option>
                  <option value="Practical">Practical</option>
                  <option value="Project">Project</option>
                  <option value="Exam">Exam</option>
                  <option value="Quiz">Quiz</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-semibold mb-1">Due Date</label>
                <input type="date" id="a-date" required value="${existing ? existing.due_date : getOffsetDateString(4)}" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
              <div>
                <label class="block font-semibold mb-1">Due Time</label>
                <input type="time" id="a-time" value="${existing ? existing.due_time : '23:59'}" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
              <div>
                <label class="block font-semibold mb-1">Weight %</label>
                <input type="number" id="a-weight" min="1" max="100" value="${existing ? existing.weight : '20'}" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
            </div>
            <div>
              <label class="block font-semibold mb-1">Description / Deliverables</label>
              <textarea id="a-desc" rows="2" placeholder="Submission portal, topics covered..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">${existing ? (existing.description || '') : ''}</textarea>
            </div>
          </div>
        `,
        confirmText: isEdit ? "Update Assessment" : "Create Assessment",
        onConfirm: () => {
          const name = document.getElementById('a-name').value.trim();
          const due_date = document.getElementById('a-date').value;
          if (!name || !due_date) {
            showToast("Please provide an assessment title and deadline date.", "error");
            return;
          }

          const assessmentData = {
            id: isEdit ? existing.id : ('ass-' + Date.now()),
            name,
            module_id: document.getElementById('a-module').value,
            type: document.getElementById('a-type').value,
            due_date,
            due_time: document.getElementById('a-time').value || '23:59',
            weight: Number(document.getElementById('a-weight').value) || 10,
            description: document.getElementById('a-desc').value.trim(),
            status: isEdit ? existing.status : 'Not started'
          };

          if (isEdit) {
            const idx = window.StudyFlow.assessments.findIndex(a => a.id === existing.id);
            if (idx !== -1) window.StudyFlow.assessments[idx] = assessmentData;
          } else {
            window.StudyFlow.assessments.push(assessmentData);
          }

          showToast(isEdit ? "Assessment updated." : "Assessment added to deadline tracker.");
          renderAllViews();
        }
      });
    };

    window.editAssessment = function(id) {
      const ass = window.StudyFlow.assessments.find(a => a.id === id);
      if (ass) openAssessmentModal(ass);
    };

    window.updateAssessmentStatus = function(id, status) {
      const ass = window.StudyFlow.assessments.find(a => a.id === id);
      if (ass) {
        ass.status = status;
        showToast(`Assessment marked as ${status}.`);
        renderAllViews();
      }
    };

    window.confirmDeleteAssessment = function(id) {
      openModal({
        title: "Delete Assessment?",
        subtitle: "Deadline Removal",
        bodyHtml: "Are you sure you want to remove this assessment?",
        confirmText: "Yes, Delete",
        confirmClass: "bg-rose-600 hover:bg-rose-700",
        onConfirm: () => {
          window.StudyFlow.assessments = window.StudyFlow.assessments.filter(a => a.id !== id);
          showToast("Assessment removed.");
          renderAllViews();
        }
      });
    };

    const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    window.renderTimetable = function() {
      const tabsContainer = document.getElementById('timetable-day-tabs');
      tabsContainer.innerHTML = '';

      WEEK_DAYS.forEach(day => {
        const count = window.StudyFlow.timetable.filter(t => t.day.toLowerCase() === day.toLowerCase()).length;
        const isActive = window.StudyFlow.activeTimetableDay.toLowerCase() === day.toLowerCase();

        const tabBtn = document.createElement('button');
        tabBtn.className = `px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`;
        tabBtn.innerHTML = `
          <span>${day}</span>
          ${count > 0 ? `<span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'} font-bold">${count}</span>` : ''}
        `;
        tabBtn.onclick = () => {
          window.StudyFlow.activeTimetableDay = day;
          renderTimetable();
        };
        tabsContainer.appendChild(tabBtn);
      });

      const content = document.getElementById('timetable-day-content');
      content.innerHTML = '';

      const dayClasses = window.StudyFlow.timetable
        .filter(t => t.day.toLowerCase() === window.StudyFlow.activeTimetableDay.toLowerCase())
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      if (dayClasses.length === 0) {
        content.innerHTML = `
          <div class="py-12 text-center text-slate-400">
            <i data-lucide="coffee" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
            <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">No classes scheduled for ${window.StudyFlow.activeTimetableDay}</h4>
            <p class="text-xs text-slate-500 mt-1">Use this free window for revision or add a new lecture slot.</p>
            <button onclick="openTimetableModal('${window.StudyFlow.activeTimetableDay}')" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl">Add Class</button>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      const listWrapper = document.createElement('div');
      listWrapper.className = "space-y-3";

      dayClasses.forEach(entry => {
        const mod = window.StudyFlow.modules.find(m => m.id === entry.module_id);
        const card = document.createElement('div');
        card.className = "p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition";
        card.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="text-center font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shrink-0">
              <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">${entry.start_time}</span>
              <span class="text-[10px] text-slate-400 block">to ${entry.end_time}</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900 dark:text-white">${mod ? mod.name : 'University Lecture'}</span>
                ${mod ? `<span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">${mod.code}</span>` : ''}
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                <span>${entry.location || 'Lecture Hall'}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button onclick="confirmDeleteTimetableEntry('${entry.id}')" class="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;
        listWrapper.appendChild(card);
      });

      content.appendChild(listWrapper);
      lucide.createIcons();
    };

    window.openTimetableModal = function(defaultDay = null) {
      const selectedDay = defaultDay || window.StudyFlow.activeTimetableDay;
      const modulesOptions = window.StudyFlow.modules.map(m => `
        <option value="${m.id}">${m.code} — ${m.name}</option>
      `).join('');

      const daysOptions = WEEK_DAYS.map(d => `
        <option value="${d}" ${d.toLowerCase() === selectedDay.toLowerCase() ? 'selected' : ''}>${d}</option>
      `).join('');

      openModal({
        title: "Add Timetable Entry",
        subtitle: "Schedule & Overlap Prevention",
        bodyHtml: `
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1">Module</label>
              <select id="tt-module" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
                ${modulesOptions}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Day of Week</label>
                <select id="tt-day" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
                  ${daysOptions}
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Location / Room</label>
                <input type="text" id="tt-location" placeholder="e.g. Lab 3B or Online" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Start Time</label>
                <input type="time" id="tt-start" value="08:00" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
              <div>
                <label class="block font-semibold mb-1">End Time</label>
                <input type="time" id="tt-end" value="10:00" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
            </div>
          </div>
        `,
        confirmText: "Add to Timetable",
        onConfirm: () => {
          const day = document.getElementById('tt-day').value;
          const start = document.getElementById('tt-start').value;
          const end = document.getElementById('tt-end').value;

          if (start >= end) {
            showToast("End time must be after start time.", "error");
            return;
          }

          const conflict = window.StudyFlow.timetable.find(t => {
            if (t.day.toLowerCase() !== day.toLowerCase()) return false;
            return (start < t.end_time && end > t.start_time);
          });

          if (conflict) {
            const conflictMod = window.StudyFlow.modules.find(m => m.id === conflict.module_id);
            showToast(`Time conflict with ${conflictMod ? conflictMod.name : 'another class'} (${conflict.start_time} - ${conflict.end_time})!`, "error");
            return;
          }

          const entryData = {
            id: 'tt-' + Date.now(),
            module_id: document.getElementById('tt-module').value,
            day, start_time: start, end_time: end,
            location: document.getElementById('tt-location').value.trim() || 'Classroom'
          };

          window.StudyFlow.timetable.push(entryData);
          showToast("Timetable updated without conflicts.");
          window.StudyFlow.activeTimetableDay = day;
          renderAllViews();
        }
      });
    };

    window.confirmDeleteTimetableEntry = function(id) {
      openModal({
        title: "Delete Class Slot?",
        subtitle: "Schedule Modification",
        bodyHtml: "Are you sure you want to remove this class from your weekly timetable?",
        confirmText: "Yes, Remove",
        confirmClass: "bg-rose-600 hover:bg-rose-700",
        onConfirm: () => {
          window.StudyFlow.timetable = window.StudyFlow.timetable.filter(t => t.id !== id);
          showToast("Class removed from timetable.");
          renderAllViews();
        }
      });
    };

    window.generateAutomaticStudyPlan = function() {
      const daysHorizon = Number(document.getElementById('gen-days-range').value) || 7;
      const hoursPerDay = Number(document.getElementById('gen-hours-day').value) || 2.5;
      const preferredTime = document.getElementById('gen-preferred-time').value;
      const sessionDurationMinutes = Number(document.getElementById('gen-session-duration').value) || 60;

      const { modules, assessments } = window.StudyFlow;
      if (modules.length === 0) {
        showToast("Please add modules before generating a study plan.", "warning");
        return;
      }

      const moduleScores = modules.map(mod => {
        let score = 0;
        const gap = Math.max(0, (Number(mod.target_mark) || 75) - (Number(mod.current_mark) || 0));
        score += gap * 2.0;

        if (mod.difficulty === 'Hard') score += 30;
        else if (mod.difficulty === 'Medium') score += 15;
        else score += 5;

        const pendingAss = assessments.filter(a => a.module_id === mod.id && a.status !== 'Completed');
        pendingAss.forEach(a => {
          const daysLeft = calculateDaysUntil(a.due_date);
          if (daysLeft <= 3) score += 60;
          else if (daysLeft <= 7) score += 35;
          else score += 15;
        });

        return { module: mod, score };
      });

      moduleScores.sort((a, b) => b.score - a.score);

      let baseStartHour = 18;
      if (preferredTime === 'Morning') baseStartHour = 8;
      if (preferredTime === 'Afternoon') baseStartHour = 14;

      const newSessions = [];
      let currentModuleIndex = 0;

      for (let dayOffset = 0; dayOffset < daysHorizon; dayOffset++) {
        const sessionDate = getOffsetDateString(dayOffset);
        let currentMinutes = baseStartHour * 60;
        const totalMinutesBudget = hoursPerDay * 60;
        let dayMinutesAllocated = 0;

        while (dayMinutesAllocated + sessionDurationMinutes <= totalMinutesBudget) {
          const chosenModule = moduleScores[currentModuleIndex % moduleScores.length].module;
          
          const startH = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
          const startM = String(currentMinutes % 60).padStart(2, '0');
          const endTotalMin = currentMinutes + sessionDurationMinutes;
          const endH = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
          const endM = String(endTotalMin % 60).padStart(2, '0');

          newSessions.push({
            id: 'ss-gen-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            module_id: chosenModule.id,
            date: sessionDate,
            start_time: `${startH}:${startM}`,
            end_time: `${endH}:${endM}`,
            duration: sessionDurationMinutes,
            completed: false
          });

          currentMinutes += sessionDurationMinutes + 15;
          dayMinutesAllocated += sessionDurationMinutes;
          currentModuleIndex++;
        }
      }

      window.StudyFlow.studySessions = newSessions;
      persistCurrentUserData();
      showToast(`Generated ${newSessions.length} prioritized study sessions!`, "success");
      renderStudySessions();
      renderDashboard();
    };

    window.generatePlanForLowestModule = function() {
      navigate('studyplan');
      generateAutomaticStudyPlan();
    };

    window.renderStudySessions = function() {
      const container = document.getElementById('study-sessions-list');
      container.innerHTML = '';
      document.getElementById('study-sessions-count').textContent = `${window.StudyFlow.studySessions.length} sessions scheduled`;

      const grouped = {};
      window.StudyFlow.studySessions.forEach(s => {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      });

      Object.keys(grouped).sort().forEach(dateStr => {
        const dayWrapper = document.createElement('div');
        dayWrapper.className = "space-y-2";
        
        const dayHeader = document.createElement('div');
        dayHeader.className = "flex items-center gap-2 pt-2";
        dayHeader.innerHTML = `
          <span class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">${getDayNameFromDate(dateStr)}</span>
          <span class="text-[11px] text-slate-400 font-mono">• ${formatDateDisplay(dateStr)}</span>
        `;
        dayWrapper.appendChild(dayHeader);

        grouped[dateStr].forEach(session => {
          const mod = window.StudyFlow.modules.find(m => m.id === session.module_id);
          const item = document.createElement('div');
          item.className = `p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm transition ${session.completed ? 'opacity-50' : 'hover:border-indigo-200'}`;
          item.innerHTML = `
            <div class="flex items-center gap-3">
              <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                ${session.start_time} – ${session.end_time}
              </span>
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white ${session.completed ? 'line-through text-slate-400' : ''}">${mod ? mod.name : 'Focus Review'}</h4>
                <p class="text-[11px] text-slate-500">${session.duration} min deep study block • ${mod ? mod.code : ''}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="toggleStudySessionCompletion('${session.id}')" class="p-1.5 rounded-lg border ${session.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:border-emerald-500'} transition">
                <i data-lucide="check" class="w-4 h-4"></i>
              </button>
            </div>
          `;
          dayWrapper.appendChild(item);
        });

        container.appendChild(dayWrapper);
      });
      lucide.createIcons();
    };

    window.toggleStudySessionCompletion = function(id) {
      const s = window.StudyFlow.studySessions.find(item => item.id === id);
      if (s) {
        s.completed = !s.completed;
        persistCurrentUserData();
        showToast(s.completed ? "Study session completed! Great focus." : "Session unmarked.");
        renderStudySessions();
        renderDashboard();
        if (!document.getElementById('page-analytics').classList.contains('hidden')) {
          renderCharts();
        }
      }
    };

    window.renderDailyPlanner = function() {
      const container = document.getElementById('daily-tasks-list');
      container.innerHTML = '';
      window.StudyFlow.tasks.forEach(task => {
        const mod = window.StudyFlow.modules.find(m => m.id === task.module_id);
        const prioColor = task.priority === 'High' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' : (task.priority === 'Medium' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' : 'text-slate-600 bg-slate-100 dark:bg-slate-800');

        const card = document.createElement('div');
        card.className = `p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm transition ${task.completed ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : 'hover:border-indigo-200'}`;
        card.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <button onclick="toggleTaskCompletion('${task.id}')" class="w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700 text-transparent hover:border-indigo-500'}">
              <i data-lucide="check" class="w-4 h-4"></i>
            </button>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold text-slate-900 dark:text-white ${task.completed ? 'line-through text-slate-400' : ''}">${task.title}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${prioColor}">${task.priority}</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ${mod ? `${mod.name} • ` : ''}
                ${task.start_time ? `${task.start_time} - ${task.end_time}` : 'Anytime today'}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button onclick="confirmDeleteTask('${task.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;
        container.appendChild(card);
      });
      lucide.createIcons();
    };

    window.toggleTaskCompletion = function(id) {
      const task = window.StudyFlow.tasks.find(t => t.id === id);
      if (task) {
        task.completed = !task.completed;
        showToast(task.completed ? "Task marked complete!" : "Task marked incomplete.");
        renderAllViews();
      }
    };

    window.openTaskModal = function() {
      const modulesOptions = window.StudyFlow.modules.map(m => `
        <option value="${m.id}">${m.code} — ${m.name}</option>
      `).join('');

      openModal({
        title: "Add Task to Planner",
        subtitle: "Schedule & Focus Priority",
        bodyHtml: `
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1">Task Title</label>
              <input type="text" id="tsk-title" required placeholder="e.g. Complete math exercises 4.1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Module</label>
                <select id="tsk-module" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
                  <option value="">(No specific module)</option>
                  ${modulesOptions}
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Priority</label>
                <select id="tsk-prio" class="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
                  <option value="Low">Low</option>
                  <option value="Medium" selected>Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Start Time</label>
                <input type="time" id="tsk-start-time" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
              <div>
                <label class="block font-semibold mb-1">End Time</label>
                <input type="time" id="tsk-end-time" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
            </div>
          </div>
        `,
        confirmText: "Save Task",
        onConfirm: () => {
          const title = document.getElementById('tsk-title').value.trim();
          if (!title) {
            showToast("Task title is required.", "error");
            return;
          }

          const startTime = document.getElementById('tsk-start-time').value;
          const endTime = document.getElementById('tsk-end-time').value;
          if (!startTime || !endTime || endTime <= startTime) {
            showToast("Please enter a valid start and end time.", "error");
            return;
          }

          window.StudyFlow.tasks.push({
            id: 'tsk-' + Date.now(),
            title,
            module_id: document.getElementById('tsk-module').value || null,
            priority: document.getElementById('tsk-prio').value,
            date: getTodayDateString(),
            start_time: startTime,
            end_time: endTime,
            completed: false
          });

          showToast("Task added to Daily Planner.");
          renderAllViews();
        }
      });
    };

    window.confirmDeleteTask = function(id) {
      openModal({
        title: "Delete Task?",
        subtitle: "Daily Planner",
        bodyHtml: "Are you sure you want to remove this task?",
        confirmText: "Yes, Delete",
        confirmClass: "bg-rose-600 hover:bg-rose-700",
        onConfirm: () => {
          window.StudyFlow.tasks = window.StudyFlow.tasks.filter(t => t.id !== id);
          showToast("Task deleted.");
          renderAllViews();
        }
      });
    };

    window.renderSleep = function() {
      const container = document.getElementById('sleep-records-tbody');
      container.innerHTML = '';
      const records = window.StudyFlow.sleepRecords;

      let totalDuration = 0;
      records.forEach(rec => {
        totalDuration += Number(rec.duration) || 0;
        const h = Math.floor(rec.duration);
        const m = Math.round((rec.duration - h) * 60);

        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50/50 dark:hover:bg-slate-800/40";
        row.innerHTML = `
          <td class="py-3 font-semibold text-slate-800 dark:text-slate-200">${formatDateDisplay(rec.date)}</td>
          <td class="py-3 font-mono">${rec.bedtime}</td>
          <td class="py-3 font-mono">${rec.wake_time}</td>
          <td class="py-3 font-bold text-slate-900 dark:text-white font-mono">${h}h ${m > 0 ? m + 'm' : ''}</td>
          <td class="py-3">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.duration >= 7.5 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}">
              ${rec.duration >= 7.5 ? 'Optimal' : 'Short'}
            </span>
          </td>
          <td class="py-3 text-right">
            <button onclick="confirmDeleteSleep('${rec.id}')" class="text-slate-400 hover:text-rose-500 p-1 rounded transition" title="Delete record">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        `;
        container.appendChild(row);
      });

      const avgDuration = (totalDuration / (records.length || 1)).toFixed(1);
      const targetHours = window.StudyFlow.currentUser?.target_sleep || 8;
      const recText = document.getElementById('sleep-recommendation-text');
      
      if (avgDuration < (targetHours - 0.5)) {
        recText.innerHTML = `💡 Your average sleep this week is <strong>${avgDuration}h</strong> (below target: ${targetHours}h). Consider moving late study sessions earlier to maintain daytime focus and retention.`;
      } else {
        recText.innerHTML = `🌟 Excellent routine! Your weekly average sleep is <strong>${avgDuration}h</strong>, aligning with your ${targetHours}h cognitive rest target.`;
      }

      lucide.createIcons();
    };

    window.openSleepLogModal = function() {
      openModal({
        title: "Log Sleep Record",
        subtitle: "Cognitive Recovery Tracking",
        bodyHtml: `
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1">Date</label>
              <input type="date" id="slp-date" value="${getTodayDateString()}" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Bedtime</label>
                <input type="time" id="slp-bed" value="23:00" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
              <div>
                <label class="block font-semibold mb-1">Wake Time</label>
                <input type="time" id="slp-wake" value="06:30" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              </div>
            </div>
          </div>
        `,
        confirmText: "Record Sleep",
        onConfirm: () => {
          const date = document.getElementById('slp-date').value;
          const bed = document.getElementById('slp-bed').value;
          const wake = document.getElementById('slp-wake').value;

          const [bH, bM] = bed.split(':').map(Number);
          const [wH, wM] = wake.split(':').map(Number);

          let totalMins = (wH * 60 + wM) - (bH * 60 + bM);
          if (totalMins < 0) totalMins += 24 * 60;
          const durationHours = Number((totalMins / 60).toFixed(1));

          window.StudyFlow.sleepRecords.unshift({
            id: 'slp-' + Date.now(),
            date, bedtime: bed, wake_time: wake, duration: durationHours
          });

          showToast(`Logged ${durationHours} hours of sleep.`);
          renderAllViews();
        }
      });
    };

    window.confirmDeleteSleep = function(id) {
      openModal({
        title: "Delete Sleep Record?",
        subtitle: "Sleep Log",
        bodyHtml: "Are you sure you want to remove this recorded sleep session?",
        confirmText: "Yes, Delete",
        confirmClass: "bg-rose-600 hover:bg-rose-700",
        onConfirm: () => {
          window.StudyFlow.sleepRecords = window.StudyFlow.sleepRecords.filter(s => s.id !== id);
          showToast("Sleep record removed.");
          renderAllViews();
        }
      });
    };

    let chartModuleMarks = null;
    let chartStudyHours = null;
    let chartTasksRatio = null;

    function renderCharts() {
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

      const ctxMarks = document.getElementById('chart-module-marks')?.getContext('2d');
      if (ctxMarks) {
        if (chartModuleMarks) chartModuleMarks.destroy();
        const labels = window.StudyFlow.modules.map(m => m.code);
        const marks = window.StudyFlow.modules.map(m => m.current_mark);
        const targets = window.StudyFlow.modules.map(m => m.target_mark);

        chartModuleMarks = new Chart(ctxMarks, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Current Mark (%)', data: marks, backgroundColor: '#6366f1', borderRadius: 8 },
              { label: 'Target Mark (%)', data: targets, backgroundColor: isDark ? '#334155' : '#cbd5e1', borderRadius: 8 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor, font: { size: 11, family: 'Inter' } } } },
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
              y: { max: 100, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } }
            }
          }
        });
      }

      const ctxHours = document.getElementById('chart-study-hours')?.getContext('2d');
      if (ctxHours) {
        if (chartStudyHours) chartStudyHours.destroy();

        const moduleIds = new Set(window.StudyFlow.modules.map(module => module.id));
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(today.getDate() + mondayOffset);

        const weekDates = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + index);
          return date.toISOString().split('T')[0];
        });
        const weekHours = weekDates.map(date =>
          window.StudyFlow.studySessions
            .filter(session =>
              session.completed &&
              moduleIds.has(session.module_id) &&
              session.date === date
            )
            .reduce((total, session) => total + (Number(session.duration) || 0), 0) / 60
        ).map(hours => Number(hours.toFixed(1)));
        const totalStudyHours = Number(weekHours.reduce((total, hours) => total + hours, 0).toFixed(1));
        document.getElementById('analytics-study-hours-total').textContent = `Total: ${totalStudyHours} hrs`;

        chartStudyHours = new Chart(ctxHours, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'Study Hours',
              data: weekHours,
              borderColor: '#14b8a6',
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              fill: true,
              tension: 0.35,
              borderWidth: 2,
              pointBackgroundColor: '#14b8a6'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor, font: { size: 11, family: 'Inter' } } } },
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
              y: { max: 5, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } }
            }
          }
        });
      }

      const ctxTasks = document.getElementById('chart-tasks-ratio')?.getContext('2d');
      if (ctxTasks) {
        if (chartTasksRatio) chartTasksRatio.destroy();
        const completed = window.StudyFlow.tasks.filter(t => t.completed).length;
        const pending = window.StudyFlow.tasks.length - completed;

        chartTasksRatio = new Chart(ctxTasks, {
          type: 'doughnut',
          data: {
            labels: ['Completed Tasks', 'Remaining Tasks'],
            datasets: [{
              data: [completed, pending],
              backgroundColor: ['#10b981', isDark ? '#334155' : '#e2e8f0'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 } } } },
            cutout: '72%'
          }
        });
      }
    }

    window.saveSettings = function(e) {
      e.preventDefault();
      const user = window.StudyFlow.currentUser || DEFAULT_USER_PROFILE;
      user.name = document.getElementById('set-name').value.trim() || user.name;
      user.university = document.getElementById('set-uni').value.trim() || user.university;
      user.course = document.getElementById('set-course').value.trim() || user.course;
      user.target_sleep = Number(document.getElementById('set-sleep-hours').value) || 8;
      user.wake_time = document.getElementById('set-wake-time').value || '06:30';
      user.default_study_block = Number(document.getElementById('set-study-block').value) || 60;

      window.StudyFlow.currentUser = user;
      showToast("Student settings and preferences saved.");
      updateUserUI();
      renderAllViews();
    };

    window.loadSampleKhutsoData = function() {
      openModal({
        title: "Load Khutso Demo Data?",
        subtitle: "Sample Dataset Reload",
        bodyHtml: "This will restore the complete realistic dataset for Khutso.",
        confirmText: "Load Demo Data",
        onConfirm: () => {
          seedMemoryDefaults();
          showToast("Khutso's demo data restored.");
          updateUserUI();
          renderAllViews();
        }
      });
    };

    window.confirmClearUserData = function() {
      openModal({
        title: "Clear All Planning Data?",
        subtitle: "Database Reset",
        bodyHtml: "Are you sure you want to clear your modules, timetable, assessments, and study sessions?",
        confirmText: "Reset All",
        confirmClass: "bg-rose-600 hover:bg-rose-700",
        onConfirm: () => {
          window.StudyFlow.modules = [];
          window.StudyFlow.assessments = [];
          window.StudyFlow.timetable = [];
          window.StudyFlow.tasks = [];
          window.StudyFlow.studySessions = [];
          window.StudyFlow.sleepRecords = [];
          showToast("All data cleared.");
          renderAllViews();
        }
      });
    };

    function renderAllViews() {
      persistCurrentUserData();
      renderDashboard();
      renderModules();
      renderAssessments();
      renderTimetable();
      renderStudySessions();
      renderDailyPlanner();
      renderSleep();
      lucide.createIcons();
    }

    window.addEventListener('DOMContentLoaded', () => {
      seedMemoryDefaults();
      updateUserUI();
      renderAllViews();
      startAssessmentReminderService();
    });
