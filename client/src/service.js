
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;
axios.defaults.baseURL = apiUrl;

// Request Interceptor – הוספת JWT לכל בקשה
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor – טיפול בשגיאת 401
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';

      // לא מפנים מחדש כששגיאת 401 מגיעה מהתחברות או הרשמה
      const isAuthRequest =
        requestUrl.includes('/login') ||
        requestUrl.includes('/register');

      if (!isAuthRequest) {
        localStorage.removeItem('token');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default {
  getTasks: async () => {
    const result = await axios.get('/items');
    return result.data;
  },

  addTask: async (name) => {
    const data = { name: name, isComplete: false };
    const result = await axios.post('/items', data);
    return result.data;
  },

  setCompleted: async (id, isComplete) => {
    const response = await axios.get('/items');
    const tasks = response.data;

    const task = tasks.find(task => task.id === id);

    if (!task) {
      throw new Error(`Task with id ${id} was not found`);
    }

    const updatedTask = {
      id: task.id,
      name: task.name,
      isComplete: isComplete
    };

    const result = await axios.put(`/items/${id}`, updatedTask);
    return result.data;
  },

  deleteTask: async (id) => {
    const result = await axios.delete(`/items/${id}`);
    return result.data;
  }
};
