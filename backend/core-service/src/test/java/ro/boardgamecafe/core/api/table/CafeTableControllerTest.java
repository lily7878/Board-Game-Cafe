package ro.boardgamecafe.core.api.table;

import org.springframework.test.web.servlet.MockMvc;

import ro.boardgamecafe.core.domain.table.CafeTable;
import ro.boardgamecafe.core.service.CafeTableService;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import java.util.Collections;
import java.util.Optional;

import org.springframework.http.MediaType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(CafeTableController.class)
public class CafeTableControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CafeTableService cafeTableService;


    @Test
    @WithMockUser
    public void getAllTables_ShouldReturnEmptyList_WhenNoTablesExist() throws Exception {
        when(cafeTableService.getAllTables()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/admin/tables"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

    }

    @Test
    @WithMockUser
    public void getAllTables_ShouldReturn404_WhenTableDoesNotExist() throws Exception {
        when(cafeTableService.getTableById(99999L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/admin/tables/99999"))
                .andExpect(status().isNotFound());
    }

    @Test 
    @WithMockUser 
    public void createTable_ShouldReturn201_WhenRequestIsValid() throws Exception {
        CafeTable table = new CafeTable(1, 4);
        String json = """
                    {
                    "tableNumber": 1,
                    "capacity": 4
                    }
                    """;
        when(cafeTableService.createTable(1, 4)).thenReturn(table);
        mockMvc.perform(post("/api/admin/tables")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tableNumber").value(1))
                .andExpect(jsonPath("$.capacity").value(4));
    }

    @Test
    @WithMockUser 
    public void createTable_ShouldReturn400_WhenCapacityIsNegative() throws Exception {
        String json = """
                    {
                    "tableNumber": 1,
                    "capacity": -4
                    }
                    """;
        mockMvc.perform(post("/api/admin/tables")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest());
    }
}
