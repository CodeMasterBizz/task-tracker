try {
  const { supabase } = await import('./supabase.js');

  // DOM Elements
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const authForms = document.getElementById('auth-forms');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');
  const userMenu = document.getElementById('user-menu');
  const userEmail = document.getElementById('user-email');
  const logoutButton = document.getElementById('logout-button');
  const taskDashboard = document.getElementById('task-dashboard');
  const streakCounter = document.getElementById('streak-counter');
  const progressBar = document.querySelector('.progress-bar-fill');
  const progressText = document.querySelector('.progress-bar + div');
  
  let userLevel = 1;
  let tasksCompleted = 0;
  let streak = 0;
  const TASKS_PER_LEVEL = 5;

  if (!taskForm || !taskInput || !taskList || !authForms || !loginForm || !signupForm) {
    throw new Error('Required DOM elements not found!');
  }

  // Initially hide task form and show auth forms
  taskForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
  authForms.classList.remove('hidden');

  // Toggle between login and signup forms
  showSignupBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  });

  showLoginBtn.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // Handle login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      showToast('Logging in...', 'info');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      showToast('Logged in successfully!', 'success');
      loginForm.reset();
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed: ' + error.message, 'error');
    }
  });

  // Handle signup
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    try {
      showToast('Creating your account...', 'info');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) {
        if (error.message.includes('Email')) {
          showToast('Please enter a valid email address', 'error');
        } else {
          throw error;
        }
        return;
      }

      if (data?.user) {
        showToast('Account created! Please check your email to verify your account.', 'info');
        signupForm.reset();
        // Don't automatically log in - wait for email verification
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast('Signup failed: ' + error.message, 'error');
    }
  });

  // Handle logout
  logoutButton.addEventListener('click', async () => {
    try {
      showToast('Logging out...', 'info');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast('Logged out successfully!', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed: ' + error.message, 'error');
    }
  });

  // Handle auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    if (session) {
      // User is logged in
      authForms.classList.add('hidden');
      userMenu.classList.remove('hidden');
      userEmail.textContent = session.user.email;
      taskDashboard.classList.remove('hidden');
      taskForm.classList.remove('hidden');
      streakCounter.classList.remove('hidden');
      loadTasks(); // Reload tasks for the logged-in user
    } else {
      // User is logged out
      authForms.classList.remove('hidden');
      userMenu.classList.add('hidden');
      userEmail.textContent = '';
      taskDashboard.classList.add('hidden');
      taskForm.classList.add('hidden');
      streakCounter.classList.add('hidden');
      taskList.innerHTML = ''; // Clear tasks when logged out
    }
  });

  function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const closeBtn = document.getElementById('toast-close');
    
    toast.classList.remove('bg-green-100', 'bg-red-100', 'bg-blue-100', 'text-green-800', 'text-red-800', 'text-blue-800');
    
    switch (type) {
      case 'error':
        toast.classList.add('bg-red-100', 'text-red-800');
        break;
      case 'info':
        toast.classList.add('bg-blue-100', 'text-blue-800');
        break;
      default:
        toast.classList.add('bg-green-100', 'text-green-800');
    }
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('opacity-100');

    const hideToast = () => {
      toast.classList.add('hidden');
      toast.classList.remove('opacity-100');
    };

    closeBtn.onclick = hideToast;
    setTimeout(hideToast, duration);
  }

  function updateTaskCounter(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const counter = document.getElementById('task-counter');
    counter.textContent = `${completed} of ${total} tasks completed`;
  }

  async function loadTasks() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        taskList.innerHTML = '';
        return;
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      taskList.innerHTML = '';
      if (tasks && tasks.length > 0) {
        tasks.forEach(task => createTaskElement(task));
        updateTaskCounter(tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      taskList.innerHTML = `
        <li class="text-center text-red-500 py-4">
          Failed to load tasks. Please try again later.
        </li>
      `;
    }
  }

  function updateProgress() {
    const percentage = (tasksCompleted % TASKS_PER_LEVEL) * (100 / TASKS_PER_LEVEL);
    progressBar.style.width = `${percentage}%`;
    progressText.innerHTML = `
      <span>${tasksCompleted % TASKS_PER_LEVEL}/${TASKS_PER_LEVEL} tasks completed</span>
      <span>Next level: ${TASKS_PER_LEVEL - (tasksCompleted % TASKS_PER_LEVEL)} tasks</span>
    `;

    // Check for level up
    const newLevel = Math.floor(tasksCompleted / TASKS_PER_LEVEL) + 1;
    if (newLevel > userLevel) {
      userLevel = newLevel;
      document.querySelector('#user-menu .text-xs').textContent = `Level ${userLevel} Task Master`;
      document.querySelector('.progress-bar').parentElement.querySelector('span').textContent = `Level ${userLevel}`;
      celebrateLevelUp();
    }
  }

  function celebrateLevelUp() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    showToast('🎉 Level Up! Keep up the great work!', 'success', 5000);
  }

  function createTaskElement(task) {
    const taskItem = document.createElement('li');
    taskItem.className = 'task-item bg-white p-4 rounded-xl shadow-md flex justify-between items-center transition-all duration-300 hover:shadow-lg';
    taskItem.dataset.id = task.id;
    
    const leftSection = document.createElement('div');
    leftSection.className = 'flex items-center gap-3';
    
    const checkbox = document.createElement('button');
    checkbox.className = 'w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center transition-colors';
    
    const taskContent = document.createElement('div');
    taskContent.className = 'flex flex-col';
    
    const taskTitle = document.createElement('span');
    taskTitle.textContent = task.title;
    taskTitle.className = 'font-medium transition-colors';
    
    const timestamp = document.createElement('small');
    timestamp.textContent = new Date(task.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    timestamp.className = 'text-xs text-gray-500';

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.className = 'ml-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors';

    if (task.completed) {
      taskItem.classList.add('completed');
      checkbox.classList.add('bg-[#58CC02]');
      checkbox.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      taskTitle.classList.add('line-through', 'text-gray-400');
    }

    checkbox.addEventListener('click', async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ completed: !task.completed })
          .eq('id', task.id);

        if (error) throw error;

        task.completed = !task.completed;
        if (task.completed) {
          tasksCompleted++;
          checkbox.classList.add('bg-[#58CC02]');
          checkbox.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
          taskTitle.classList.add('line-through', 'text-gray-400');
          taskItem.classList.add('completed');
          
          // Play success sound and show mini confetti
          confetti({
            particleCount: 30,
            spread: 20,
            origin: { y: 0.8 }
          });
        } else {
          tasksCompleted = Math.max(0, tasksCompleted - 1);
          checkbox.classList.remove('bg-[#58CC02]');
          checkbox.innerHTML = '';
          taskTitle.classList.remove('line-through', 'text-gray-400');
          taskItem.classList.remove('completed');
        }

        updateProgress();
        updateTaskCounter();
      } catch (error) {
        console.error('Error updating task:', error);
        showToast('Failed to update task', 'error');
      }
    });

    deleteBtn.addEventListener('click', async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id);

        if (error) throw error;

        taskItem.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
          taskItem.remove();
          updateProgress();
          updateTaskCounter();
        }, 200);
        
        showToast('Task deleted!');
      } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
      }
    });

    taskContent.appendChild(taskTitle);
    taskContent.appendChild(timestamp);
    leftSection.appendChild(checkbox);
    leftSection.appendChild(taskContent);
    taskItem.appendChild(leftSection);
    taskItem.appendChild(deleteBtn);
    taskList.appendChild(taskItem);

    // Animate in
    requestAnimationFrame(() => {
      taskItem.classList.add('scale-100', 'opacity-100');
    });
  }

  // Update task counter function
  function updateTaskCounter() {
    const tasks = document.querySelectorAll('.task-item');
    const completed = document.querySelectorAll('.task-item.completed').length;
    const total = tasks.length;
    streakCounter.textContent = `🔥 ${streak} day streak`;
  }

  // Form submission handler
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTask = taskInput.value.trim();
    if (newTask === '') return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Please login first', 'error');
        return;
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title: newTask,
          completed: false,
          user_id: session.user.id  // Always require user_id
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        createTaskElement(data[0]);
        taskInput.value = '';
        showToast('Task added!');
        
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', session.user.id);
        updateTaskCounter(tasks || []);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to add task: ' + error.message, 'error');
    }
  });

  // Initial session check and load
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    authForms.classList.add('hidden');
    userMenu.classList.remove('hidden');
    userEmail.textContent = session.user.email;
    taskForm.classList.remove('hidden');
    loadTasks();
  }

  // Set up real-time updates
  supabase
    .channel('tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks)
    .subscribe();

} catch (error) {
  console.error('Script initialization error:', error);
}
