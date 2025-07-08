package com.example.demo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class TodoControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TodoRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void testCreateTodo() throws Exception {
        String json = "{\"title\":\"Test Todo\",\"completed\":false}";
        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Test Todo"))
                .andExpect(jsonPath("$.completed").value(false));
    }

    @Test
    void testGetAllTodos() throws Exception {
        TodoItem item = new TodoItem();
        item.setTitle("Sample");
        item.setCompleted(false);
        repository.save(item);

        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Sample"));
    }

    @Test
    void testGetTodoById() throws Exception {
        TodoItem item = new TodoItem();
        item.setTitle("FindMe");
        item.setCompleted(true);
        TodoItem saved = repository.save(item);

        mockMvc.perform(get("/api/todos/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("FindMe"))
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void testUpdateTodo() throws Exception {
        TodoItem item = new TodoItem();
        item.setTitle("Old");
        item.setCompleted(false);
        TodoItem saved = repository.save(item);

        String json = "{\"title\":\"Updated\",\"completed\":true}";
        mockMvc.perform(put("/api/todos/" + saved.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated"))
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void testDeleteTodo() throws Exception {
        TodoItem item = new TodoItem();
        item.setTitle("ToDelete");
        item.setCompleted(false);
        TodoItem saved = repository.save(item);

        mockMvc.perform(delete("/api/todos/" + saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/todos/" + saved.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetTodoById_NotFound() throws Exception {
        mockMvc.perform(get("/api/todos/9999"))
                .andExpect(status().isNotFound());
    }
}
