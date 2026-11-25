
import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  Navigate
} from 'react-router-dom';
import axios from 'axios';
import service from './service.js';

// רשימת המשימות
function TodoList() {
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);

  async function getTodos() {
    const todos = await service.getTasks();
    setTodos(todos);
  }

  async function createTodo(e) {
    e.preventDefault();
    await service.addTask(newTodo);
    setNewTodo("");
    await getTodos();
  }

  async function updateCompleted(todo, isComplete) {
    await service.setCompleted(todo.id, isComplete);
    await getTodos();
  }

  async function deleteTodo(id) {
    await service.deleteTask(id);
    await getTodos();
  }

  useEffect(() => {
    getTodos();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <section className="todoapp">
      <header className="header">
        <h1>todos</h1>

        <form onSubmit={createTodo}>
          <input
            className="new-todo"
            placeholder="Well, let's take on the day"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            required
          />
        </form>
      </header>

      <section className="main" style={{ display: "block" }}>
        <ul className="todo-list">
          {todos.map(todo => (
            <li
              className={todo.isComplete ? "completed" : ""}
              key={todo.id}
            >
              <div className="view">
                <input
                  className="toggle"
                  type="checkbox"
                  checked={todo.isComplete}
                  onChange={(e) =>
                    updateCompleted(todo, e.target.checked)
                  }
                />

                <label>{todo.name}</label>

                <button
                  className="destroy"
                  onClick={() => deleteTodo(todo.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <button onClick={logout}>
        התנתקות
      </button>
    </section>
  );
}

// דף התחברות
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("/login", {
        username: username,
        password: password
      });

      localStorage.setItem("token", response.data.token);

      navigate("/");
    } catch (err) {
      setError("שם משתמש או סיסמה שגויים");
    }
  }

  return (
    <div>
      <h2>התחברות</h2>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">התחבר</button>
      </form>

      {error && <p>{error}</p>}

      <button onClick={() => navigate("/register")}>
        להרשמה
      </button>
    </div>
  );
}

// דף הרשמה
function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axios.post("/register", {
        username: username,
        password: password
      });

      setMessage("ההרשמה הצליחה. אפשר להתחבר כעת.");
    } catch (err) {
      setError("ההרשמה נכשלה. ייתכן ששם המשתמש כבר קיים.");
    }
  }

  return (
    <div>
      <h2>הרשמה</h2>

      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">הרשמה</button>
      </form>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}

      <button onClick={() => navigate("/login")}>
        מעבר להתחברות
      </button>
    </div>
  );
}

// הגנה על דף המשימות
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ניהול הנתיבים
function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <TodoList />
          </ProtectedRoute>
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
