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
      taskForm.classList.remove('hidden');
      loadTasks(); // Reload tasks for the logged-in user
    } else {
      // User is logged out
      authForms.classList.remove('hidden');
      userMenu.classList.add('hidden');
      userEmail.textContent = '';
      taskForm.classList.add('hidden');
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

  function createTaskElement(task) {
    const taskItem = document.createElement('li');
    taskItem.className = 'bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg flex justify-between items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group';
    taskItem.dataset.id = task.id;
    
    taskItem.style.opacity = '0';
    setTimeout(() => {
      taskItem.style.opacity = '1';
      taskItem.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 10);

    const leftSection = document.createElement('div');
    leftSection.className = 'flex items-center gap-4';

    const checkbox = document.createElement('button');
    checkbox.className = `w-6 h-6 rounded-full border-2 border-[#00C805] flex items-center justify-center transition-all ${task.completed ? 'bg-[#00C805]' : 'hover:bg-[#00C805]/10'}`;
    checkbox.innerHTML = task.completed ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : '';

    const taskContent = document.createElement('div');
    taskContent.className = 'flex flex-col';

    const taskSpan = document.createElement('span');
    taskSpan.textContent = task.title;
    taskSpan.className = `text-gray-700 transition-all ${task.completed ? 'line-through text-gray-400' : 'group-hover:text-[#00C805]'}`;

    const timestamp = document.createElement('small');
    timestamp.textContent = new Date(task.created_at).toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
    timestamp.className = 'text-sm text-gray-400';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'ml-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0';
    deleteBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';

    checkbox.addEventListener('click', async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ completed: !task.completed })
          .eq('id', task.id);

        if (error) throw error;

        task.completed = !task.completed;
        checkbox.innerHTML = task.completed ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : '';
        checkbox.classList.toggle('bg-[#00C805]');
        taskSpan.classList.toggle('line-through');
        taskSpan.classList.toggle('text-gray-400');

        const { data: tasks } = await supabase.from('tasks').select('*');
        updateTaskCounter(tasks);
      } catch (error) {
        console.error('Error updating task:', error);
      }
    });

    deleteBtn.addEventListener('click', async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id);

        if (error) throw error;

        taskItem.remove();
        
        // Get fresh task list and update counter
        const { data: tasks, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (fetchError) throw fetchError;
        
        updateTaskCounter(tasks || []);
        showToast('Task deleted!');
      } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
      }
    });

    taskContent.appendChild(taskSpan);
    taskContent.appendChild(timestamp);
    leftSection.appendChild(checkbox);
    leftSection.appendChild(taskContent);
    taskItem.appendChild(leftSection);
    taskItem.appendChild(deleteBtn);
    taskList.appendChild(taskItem);
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
