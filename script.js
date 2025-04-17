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

  // All the other functions
  function updateTaskCounter(tasks) {
    // ...existing code...
  }

  async function loadTasks() {
    // ...existing code...
  }

  function createTaskElement(task) {
    // ...existing code...
  }

  // Event Listeners
  taskForm.addEventListener('submit', async (e) => {
    // ...existing code...
  });

  // Initial load and real-time subscription
  loadTasks();
  document.addEventListener('DOMContentLoaded', loadTasks);
  
  supabase
    .channel('tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks)
    .subscribe();

} catch (error) {
  console.error('Script initialization error:', error);
}
