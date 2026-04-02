package com.example.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class LibraryManagementApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contextLoads() {
    }

    @Test
    void healthEndpointReportsUpAfterInitialization() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("hamo-api"));
    }

    @Test
    void loginReturnsToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "email": "admin@library.com",
                          "password": "Admin@123"
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void booksEndpointIsPublicAndSeeded() throws Exception {
        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").isNumber())
                .andExpect(jsonPath("$[0].title").isNotEmpty());
    }

    @Test
    void authLoginAcceptsViteCorsPreflight() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void refreshReturnsNewToken() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "admin@library.com",
                                  "password": "Admin@123"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String refreshToken = com.jayway.jsonpath.JsonPath.read(loginResult.getResponse().getContentAsString(),
                "$.refreshToken");

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "%s"
                                }
                                """.formatted(refreshToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void memberCanCreateAndViewReservations() throws Exception {
        String token = loginAndExtractToken("member@library.com", "Member@123");

        mockMvc.perform(post("/api/me/reservations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "bookId": 3
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.book.id").value(3))
                .andExpect(jsonPath("$.status").isNotEmpty());

        mockMvc.perform(get("/api/me/reservations")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void memberCanViewReadingInsights() throws Exception {
        String token = loginAndExtractToken("member@library.com", "Member@123");

        mockMvc.perform(get("/api/me/reading-insights")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readingPersona").isNotEmpty())
                .andExpect(jsonPath("$.summary").isNotEmpty())
                .andExpect(jsonPath("$.focusAreas").isArray());
    }

    @Test
    void memberCanCancelReservation() throws Exception {
        String token = loginAndExtractToken("member@library.com", "Member@123");

        MvcResult reservationResult = mockMvc.perform(post("/api/me/reservations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "bookId": 4
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        Number reservationId = com.jayway.jsonpath.JsonPath.read(
                reservationResult.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(delete("/api/me/reservations/{reservationId}", reservationId.longValue())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void adminCanViewUsersAndSettings() throws Exception {
        String token = loginAndExtractToken("admin@library.com", "Admin@123");

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").isNotEmpty())
                .andExpect(jsonPath("$[0].role").isNotEmpty());

        mockMvc.perform(get("/api/settings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.borrowPeriodDays").value(7))
                .andExpect(jsonPath("$.fineAmountPerWeek").value(30));
    }

    @Test
    void memberCannotAccessAdminUsers() throws Exception {
        String token = loginAndExtractToken("member@library.com", "Member@123");

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanToggleUserStatus() throws Exception {
        String token = loginAndExtractToken("admin@library.com", "Admin@123");

        mockMvc.perform(put("/api/users/1/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "active": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.active").value(true));
    }

    private String loginAndExtractToken(String email, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();

        return com.jayway.jsonpath.JsonPath.read(loginResult.getResponse().getContentAsString(), "$.token");
    }
}
