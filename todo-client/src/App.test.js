import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.resetAllMocks();
});

test("renders todo list title", () => {
  render(<App />);
  expect(screen.getByText(/TODO List/i)).toBeInTheDocument();
});

test("shows loading and then todos", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { id: 1, title: "Test Todo", completed: false },
      { id: 2, title: "Another", completed: true },
    ],
  });
  render(<App />);
  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("Test Todo")).toBeInTheDocument());
  expect(screen.getByText("Another")).toBeInTheDocument();
});

test("can add a todo", async () => {
  fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    }) // initial fetch
    .mockResolvedValueOnce({ ok: true }) // add
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, title: "New Task", completed: false },
      ],
    }); // fetch after add
  render(<App />);
  await waitFor(() => expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument());
  fireEvent.change(screen.getByPlaceholderText(/add a new task/i), { target: { value: "New Task" } });
  fireEvent.click(screen.getByRole('button', { name: /Add/i }));
  await waitFor(() => expect(screen.getByText("New Task")).toBeInTheDocument());
});

test("shows error on fetch fail", async () => {
  fetch.mockResolvedValueOnce({ ok: false });
  render(<App />);
  await waitFor(() => expect(screen.getByText(/Failed to fetch todos/i)).toBeInTheDocument());
});
