package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.BookRequest;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Book;
import com.example.demo.repository.BookRepository;

@Service
public class BookService {

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public Book createBook(BookRequest request) {
        if (bookRepository.existsByIsbn(request.isbn())) {
            throw new BadRequestException("A book with this ISBN already exists");
        }
        Book book = new Book();
        applyBookDetails(book, request);
        book.setAvailableCopies(request.totalCopies());
        return bookRepository.save(book);
    }

    public List<Book> getBooks(String keyword, String category) {
        if (keyword != null && !keyword.isBlank()) {
            return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrCategoryContainingIgnoreCase(
                    keyword, keyword, keyword);
        }
        if (category != null && !category.isBlank()) {
            return bookRepository.findByCategoryIgnoreCase(category);
        }
        return bookRepository.findAll();
    }

    public Book getBook(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + bookId));
    }

    public Book updateBook(Long bookId, BookRequest request) {
        Book book = getBook(bookId);
        int borrowedCopies = book.getTotalCopies() - book.getAvailableCopies();
        if (!book.getIsbn().equals(request.isbn()) && bookRepository.existsByIsbn(request.isbn())) {
            throw new BadRequestException("A book with this ISBN already exists");
        }
        if (request.totalCopies() < borrowedCopies) {
            throw new BadRequestException("Total copies cannot be smaller than currently issued copies");
        }
        applyBookDetails(book, request);
        book.setAvailableCopies(request.totalCopies() - borrowedCopies);
        return bookRepository.save(book);
    }

    public void deleteBook(Long bookId) {
        bookRepository.delete(getBook(bookId));
    }

    private void applyBookDetails(Book book, BookRequest request) {
        book.setTitle(request.title());
        book.setAuthor(request.author());
        book.setIsbn(request.isbn());
        book.setCategory(request.category());
        book.setDescription(request.description());
        book.setLanguage(request.language());
        book.setPublishedYear(request.publishedYear());
        book.setTotalCopies(request.totalCopies());
        book.setPrice(request.price());
        book.setTags(request.tags());
        book.setCoverUrl(request.coverUrl());
        if (book.getAverageRating() == 0) {
            book.setAverageRating(4.5);
        }
    }
}
