import React, { useEffect, useState } from "react";
import FeatherIcon from "./FeatherIcon";

const API_URL = "http://localhost:8080/api/todos";

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch todos");
      const data = await res.json();
      setTodos(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, completed: false }),
      });
      if (!res.ok) throw new Error("Failed to add todo");
      setNewTitle("");
      fetchTodos();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this todo?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404)
        throw new Error("Failed to delete todo");
      fetchTodos();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleToggle = async (todo) => {
    try {
      const res = await fetch(`${API_URL}/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...todo, completed: !todo.completed }),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      fetchTodos();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEdit = (todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const handleEditSave = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingTitle,
          completed: todos.find((t) => t.id === id).completed,
        }),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      setEditingId(null);
      setEditingTitle("");
      fetchTodos();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
        fontFamily: "Segoe UI, sans-serif",
        padding: 0,
        margin: 0,
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1
          style={{
            textAlign: "center",
            color: "#2d3748",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          TODO List
        </h1>
        <form
          onSubmit={handleAdd}
          style={{ display: "flex", gap: 8, margin: "2rem 0" }}
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new task..."
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 16,
            }}
            autoFocus
          />
          <button
            type="submit"
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "0 20px",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Add
          </button>
        </form>
        {error && (
          <div
            style={{ color: "#dc2626", marginBottom: 16, textAlign: "center" }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 16px #e0e7ef",
            padding: 0,
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: 32, color: "#64748b" }}>
              Loading...
            </div>
          ) : todos.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "#64748b" }}>
              No todos yet. Add your first task!
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid #e5e7eb",
                    padding: "0.75rem 1rem",
                    gap: 12,
                  }}
                >
                  <button
                    onClick={() => handleToggle(todo)}
                    aria-label={
                      todo.completed ? "Mark as incomplete" : "Mark as complete"
                    }
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      marginRight: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {todo.completed ? (
                      <FeatherIcon
                        name="checkSquare"
                        style={{ color: "#2563eb" }}
                      />
                    ) : (
                      <FeatherIcon name="square" style={{ color: "#cbd5e1" }} />
                    )}
                  </button>
                  {editingId === todo.id ? (
                    <>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        style={{
                          flex: 1,
                          padding: 8,
                          borderRadius: 4,
                          border: "1px solid #cbd5e1",
                          fontSize: 16,
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditSave(todo.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "0 6px",
                          cursor: "pointer",
                          marginLeft: 4,
                          display: "flex",
                          alignItems: "center",
                        }}
                        aria-label="Save"
                      >
                        <FeatherIcon name="save" style={{ color: "#059669" }} />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "0 6px",
                          cursor: "pointer",
                          marginLeft: 4,
                          display: "flex",
                          alignItems: "center",
                        }}
                        aria-label="Cancel"
                      >
                        <FeatherIcon name="x" style={{ color: "#e11d48" }} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 17,
                          color: todo.completed ? "#94a3b8" : "#1e293b",
                          textDecoration: todo.completed
                            ? "line-through"
                            : "none",
                          wordBreak: "break-word",
                        }}
                      >
                        {todo.title}
                      </span>
                      <button
                        onClick={() => handleEdit(todo)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "0 6px",
                          cursor: "pointer",
                          marginLeft: 4,
                        }}
                        aria-label="Edit"
                      >
                        <FeatherIcon name="edit" style={{ color: "#fbbf24" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "0 6px",
                          cursor: "pointer",
                          marginLeft: 4,
                        }}
                        aria-label="Delete"
                      >
                        <FeatherIcon
                          name="trash"
                          style={{ color: "#ef4444" }}
                        />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer
          style={{
            textAlign: "center",
            marginTop: 40,
            color: "#64748b",
            fontSize: 15,
          }}
        >
          &copy; {new Date().getFullYear()} TODO App
        </footer>
      </div>
    </div>
  );
}

export default App;
