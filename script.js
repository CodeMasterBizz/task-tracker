try {
  console.log('%c Task Tracker Debug Mode', 'color: blue; font-size: 20px; font-weight: bold');
  
  const { supabase } = await import('./supabase.js');
  console.log('✅ Supabase import successful');

  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');

  if (!taskForm || !taskInput || !taskList) {
    throw new Error('Required DOM elements not found!');
  }
  console.log('✅ DOM elements loaded');

  function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const closeBtn = document.getElementById('toast-close');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('opacity-100');

    const hideToast = () => {
      toast.classList.add('hidden');
      toast.classList.remove('opacity-100');
    };

    closeBtn.onclick = hideToast;
    setTimeout(hideToast, 2000);
  }

  function updateTaskCounter(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const counter = document.getElementById('task-counter');
    counter.textContent = `${completed} of ${total} tasks completed`;
  }

  async function loadTasks() {
    try {
      console.group('Loading Tasks');
      console.log('📚 Fetching tasks from Supabase...');
      
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error:', error.message);
        throw error;
      }

      console.log('✅ Tasks fetched:', tasks?.length ?? 0);
      
      taskList.innerHTML = '';
      if (tasks && tasks.length > 0) {
        tasks.forEach(task => createTaskElement(task));
        updateTaskCounter(tasks);
      }
      console.groupEnd();
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
    taskItem.className = 'bg-white p-3 rounded shadow flex justify-between items-center transition-transform duration-300 ease-in-out transform hover:scale-[1.02]';
    taskItem.dataset.id = task.id;
    
    taskItem.style.opacity = '0';
    setTimeout(() => {
      taskItem.style.opacity = '1';
      taskItem.style.transition = 'opacity 0.5s ease-in-out';
    }, 10);

    const taskSpan = document.createElement('span');
    taskSpan.textContent = task.title;
    taskSpan.title = 'Click to mark complete';
    taskSpan.className = 'cursor-pointer hover:text-blue-500 transition-colors';

    if (task.completed) {
      taskSpan.classList.add('line-through', 'text-gray-400', 'italic');
    }

    const timestamp = document.createElement('small');
    timestamp.textContent = new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timestamp.className = 'text-sm text-gray-500 mt-1 block';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.className = 'ml-4 text-red-500 hover:text-red-700 text-lg';

    taskSpan.addEventListener('click', async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ completed: !task.completed })
          .eq('id', task.id);

        if (error) throw error;

        taskSpan.classList.toggle('line-through');
        taskSpan.classList.toggle('text-gray-400');
        taskSpan.classList.toggle('italic');
        task.completed = !task.completed;

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
        showToast('Task deleted!');

        const { data: tasks } = await supabase.from('tasks').select('*');
        updateTaskCounter(tasks);
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('An unexpected error occurred while deleting the task.');
      }
    });

    taskItem.appendChild(taskSpan);
    taskItem.appendChild(timestamp);
    taskItem.appendChild(deleteBtn);
    taskList.appendChild(taskItem);
  }

  // Form submission handler
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTask = taskInput.value.trim();
    if (newTask === '') return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title: newTask,
          completed: false
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        createTaskElement(data[0]);
        taskInput.value = '';
        showToast('Task added!');
        
        const { data: tasks } = await supabase.from('tasks').select('*');
        updateTaskCounter(tasks);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add task: ' + error.message);
    }
  });

  // Initial load and subscriptions
  loadTasks();
  document.addEventListener('DOMContentLoaded', loadTasks);
  
  supabase
    .channel('tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks)
    .subscribe();

} catch (error) {
  console.error('Script initialization error:', error);
}
