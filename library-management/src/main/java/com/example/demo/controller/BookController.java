package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.BookRequest;
import com.example.demo.model.Book;
import com.example.demo.service.BookService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Book createBook(@Valid @RequestBody BookRequest request) {
        return bookService.createBook(request);
    }

    @GetMapping
    public List<Book> getBooks(@RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category) {
        return bookService.getBooks(keyword, category);
    }

    @GetMapping("/{bookId}")
    public Book getBook(@PathVariable Long bookId) {
        return bookService.getBook(bookId);
    }

    @PutMapping("/{bookId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public Book updateBook(@PathVariable Long bookId, @Valid @RequestBody BookRequest request) {
        return bookService.updateBook(bookId, request);
    }

    @DeleteMapping("/{bookId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBook(@PathVariable Long bookId) {
        bookService.deleteBook(bookId);
    }
}
