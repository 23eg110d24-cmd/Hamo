package com.example.demo.config;

import java.io.IOException;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.demo.model.Book;
import com.example.demo.model.IssueRecord;
import com.example.demo.model.IssueStatus;
import com.example.demo.model.Member;
import com.example.demo.model.PaymentRecord;
import com.example.demo.model.PaymentStatus;
import com.example.demo.model.ReservationRecord;
import com.example.demo.model.ReservationStatus;
import com.example.demo.model.User;
import com.example.demo.model.UserRole;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.MemberRepository;
import com.example.demo.repository.PaymentRecordRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.UserRepository;

@Configuration
public class DataInitializer {

    private static final Pattern YEAR_PATTERN = Pattern.compile("(19|20)\\d{2}");

    @Bean
    CommandLineRunner seedData(UserRepository userRepository, BookRepository bookRepository,
            MemberRepository memberRepository, IssueRepository issueRepository,
            PaymentRecordRepository paymentRecordRepository, ReservationRepository reservationRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.mock-data.enabled:true}") boolean mockDataEnabled,
            @Value("${app.mock-data.csv-path:}") String csvPath,
            @Value("${app.mock-data.max-books:1000}") int maxBooks,
            @Value("${app.mock-data.mock-members:12}") int mockMembers) {
        return args -> {
            seedUsers(userRepository, passwordEncoder);
            seedMembers(memberRepository, userRepository, passwordEncoder, mockMembers);

            if (bookRepository.count() == 0) {
                boolean loadedFromCsv = mockDataEnabled && loadBooksFromCsv(bookRepository, csvPath, maxBooks);
                if (!loadedFromCsv) {
                    seedFallbackBooks(bookRepository);
                }
            }
            normalizeBookCovers(bookRepository);

            seedIssuesAndPayments(bookRepository, memberRepository, issueRepository, paymentRecordRepository);
            releaseLegacySeedReservations(bookRepository, reservationRepository);
            seedReservations(bookRepository, memberRepository, reservationRepository);
        };
    }

    private void seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User();
        admin.setName("Library Admin");
        admin.setEmail("admin@library.com");
        admin.setPassword(passwordEncoder.encode("Admin@123"));
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);

        User librarian = new User();
        librarian.setName("Main Librarian");
        librarian.setEmail("librarian@library.com");
        librarian.setPassword(passwordEncoder.encode("Librarian@123"));
        librarian.setRole(UserRole.LIBRARIAN);
        userRepository.save(librarian);

        User memberUser = new User();
        memberUser.setName("Demo Member");
        memberUser.setEmail("member@library.com");
        memberUser.setPassword(passwordEncoder.encode("Member@123"));
        memberUser.setRole(UserRole.MEMBER);
        userRepository.save(memberUser);
    }

    private void seedMembers(MemberRepository memberRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder, int mockMembers) {
        Member member = new Member();
        if (memberRepository.findByEmailIgnoreCase("member@library.com").isEmpty()) {
            member.setName("Demo Member");
            member.setEmail("member@library.com");
            member.setPhone("9999999999");
            member.setDepartment("Computer Science");
            member.setMembershipNumber("MEM-1001");
            member.setJoinedAt(LocalDate.now().minusMonths(2));
            memberRepository.save(member);
        }

        if (memberRepository.count() > 1) {
            return;
        }

        String[] departments = { "Computer Science", "Mechanical", "Physics", "Mathematics", "Literature",
                "Anthropology" };
        for (int index = 2; index <= mockMembers; index++) {
            String email = "member" + index + "@library.com";
            if (userRepository.findByEmail(email).isEmpty()) {
                User user = new User();
                user.setName("Member " + index);
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode("Member@123"));
                user.setRole(UserRole.MEMBER);
                userRepository.save(user);
            }
            if (memberRepository.findByEmailIgnoreCase(email).isEmpty()) {
                Member generatedMember = new Member();
                generatedMember.setName("Member " + index);
                generatedMember.setEmail(email);
                generatedMember.setPhone("90000000" + String.format(Locale.ROOT, "%02d", index));
                generatedMember.setDepartment(departments[(index - 2) % departments.length]);
                generatedMember.setMembershipNumber("MEM-" + (1000 + index));
                generatedMember.setJoinedAt(LocalDate.now().minusDays(index * 12L));
                generatedMember.setActive(index % 7 != 0);
                memberRepository.save(generatedMember);
            }
        }
    }

    private boolean loadBooksFromCsv(BookRepository bookRepository, String csvPath, int maxBooks) {
        if (csvPath == null || csvPath.isBlank()) {
            return false;
        }

        Path path = Path.of(csvPath);
        if (!Files.exists(path)) {
            return false;
        }

        List<Book> books = new ArrayList<>();
        try (Reader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8);
                CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get().parse(reader)) {
            int count = 0;
            for (CSVRecord record : parser) {
                if (count >= maxBooks) {
                    break;
                }
                Book book = mapCsvRecord(record, count + 1);
                if (book != null && !bookRepository.existsByIsbn(book.getIsbn())) {
                    books.add(book);
                    count++;
                }
            }
        } catch (IOException exception) {
            return false;
        }

        if (books.isEmpty()) {
            return false;
        }
        bookRepository.saveAll(books);
        return true;
    }

    private Book mapCsvRecord(CSVRecord record, int sequence) {
        String title = record.get("title");
        String author = record.get("author");
        String category = record.get("category");
        String description = limit(clean(record.get("descriptions")), 1900);
        String language = extractLanguage(record.get("book_stats"));
        Integer publishedYear = extractYear(record.get("publish_year"));
        String titleId = clean(record.get("title_id"));
        String tags = limit(buildTags(category, language, record.get("reading_stats")), 900);

        if (title == null || title.isBlank() || author == null || author.isBlank()) {
            return null;
        }

        Book book = new Book();
        book.setTitle(limit(clean(title), 240));
        book.setAuthor(limit(clean(author), 240));
        book.setCategory(limit(clean(category), 240));
        book.setDescription(description);
        book.setLanguage(language);
        book.setPublishedYear(publishedYear);
        book.setTotalCopies(5);
        book.setAvailableCopies(5);
        book.setAverageRating(extractRating(record.get("reading_stats")));
        book.setPrice(BigDecimal.valueOf(399));
        book.setTags(tags);
        book.setIsbn(generatePseudoIsbn(titleId, sequence));
        book.setCoverUrl(buildCoverUrl(book.getIsbn()));
        return book;
    }

    private void seedFallbackBooks(BookRepository bookRepository) {
        bookRepository.saveAll(List.of(
                new Book("Clean Code", "Robert C. Martin", "9780132350884", "Programming",
                        "Code craftsmanship and maintainability", "English", 2008, 8, 4.8,
                        BigDecimal.valueOf(450), "software,clean-code,best-practice",
                        buildCoverUrl("9780132350884")),
                new Book("The Pragmatic Programmer", "Andrew Hunt", "9780135957059", "Programming",
                        "Practical advice for modern developers", "English", 2019, 6, 4.9,
                        BigDecimal.valueOf(550), "software,architecture,engineering",
                        buildCoverUrl("9780135957059")),
                new Book("Atomic Habits", "James Clear", "9781847941831", "Self Help",
                        "Habit building and personal growth", "English", 2018, 10, 4.7,
                        BigDecimal.valueOf(350), "habits,productivity,motivation",
                        buildCoverUrl("9781847941831")),
                new Book("Deep Work", "Cal Newport", "9781455586691", "Productivity",
                        "Focused success in a distracted world", "English", 2016, 5, 4.6,
                        BigDecimal.valueOf(400), "focus,productivity,career",
                        buildCoverUrl("9781455586691"))));
    }

    private void normalizeBookCovers(BookRepository bookRepository) {
        List<Book> booksToUpdate = bookRepository.findAll().stream()
                .filter(book -> needsCoverRefresh(book.getCoverUrl()))
                .peek(book -> book.setCoverUrl(buildCoverUrl(book.getIsbn())))
                .toList();

        if (!booksToUpdate.isEmpty()) {
            bookRepository.saveAll(booksToUpdate);
        }
    }

    private void seedIssuesAndPayments(BookRepository bookRepository, MemberRepository memberRepository,
            IssueRepository issueRepository, PaymentRecordRepository paymentRecordRepository) {
        if (issueRepository.count() > 0 || bookRepository.count() == 0 || memberRepository.count() == 0) {
            return;
        }

        List<Book> books = bookRepository.findAll();
        List<Member> members = memberRepository.findAll().stream().filter(Member::isActive).toList();
        if (books.size() < 4 || members.size() < 4) {
            return;
        }

        List<IssueRecord> issues = new ArrayList<>();
        List<PaymentRecord> payments = new ArrayList<>();

        for (int index = 0; index < Math.min(12, members.size()); index++) {
            Book book = books.get(index % books.size());
            if (book.getAvailableCopies() <= 0) {
                continue;
            }

            Member member = members.get(index);
            IssueRecord issue = new IssueRecord();
            issue.setBook(book);
            issue.setMember(member);
            issue.setIssueDate(LocalDate.now().minusDays(20L - index));
            issue.setDueDate(issue.getIssueDate().plusDays(14));
            issue.setNotes("Mock seeded issue record");

            if (index % 4 == 0) {
                issue.setReturnDate(LocalDate.now().minusDays(1));
                issue.setStatus(IssueStatus.RETURNED);
                issue.setFineAmount(BigDecimal.ZERO);
                issue.setFinePaid(true);
            } else if (index % 4 == 1) {
                issue.setReturnDate(LocalDate.now().minusDays(2));
                issue.setStatus(IssueStatus.OVERDUE);
                issue.setFineAmount(BigDecimal.valueOf(40));
                issue.setFinePaid(false);
            } else if (index % 4 == 2) {
                issue.setStatus(IssueStatus.ISSUED);
                issue.setFineAmount(BigDecimal.ZERO);
                issue.setFinePaid(true);
            } else {
                issue.setStatus(IssueStatus.OVERDUE);
                issue.setFineAmount(BigDecimal.valueOf(70));
                issue.setFinePaid(false);
            }

            if (issue.getStatus() == IssueStatus.ISSUED || issue.getStatus() == IssueStatus.OVERDUE) {
                book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
            }
            issues.add(issue);
        }

        bookRepository.saveAll(books);
        List<IssueRecord> savedIssues = issueRepository.saveAll(issues);

        for (int index = 0; index < savedIssues.size(); index++) {
            IssueRecord issue = savedIssues.get(index);
            if (issue.getFineAmount() != null && issue.getFineAmount().compareTo(BigDecimal.ZERO) > 0 && index % 3 == 0) {
                PaymentRecord payment = new PaymentRecord();
                payment.setIssueRecord(issue);
                payment.setAmount(issue.getFineAmount());
                payment.setGateway("RAZORPAY");
                payment.setGatewayOrderId("seed-order-" + issue.getId());
                payment.setGatewayPaymentId("seed-payment-" + issue.getId());
                payment.setRedirectUrl("https://payments.library.local/payments/" + issue.getId());
                payment.setStatus(PaymentStatus.PAID);
                payment.setCreatedAt(LocalDateTime.now().minusDays(1));
                payment.setPaidAt(LocalDateTime.now().minusHours(6));
                payments.add(payment);
                issue.setFinePaid(true);
            }
        }

        paymentRecordRepository.saveAll(payments);
        issueRepository.saveAll(savedIssues);
    }

    private void releaseLegacySeedReservations(BookRepository bookRepository, ReservationRepository reservationRepository) {
        List<ReservationRecord> reservationsToRelease = reservationRepository.findAll().stream()
                .filter(reservation -> reservation.getStatus() == ReservationStatus.RESERVED)
                .filter(reservation -> reservation.getBook() != null && reservation.getBook().getId() != null
                        && reservation.getBook().getId() <= 2)
                .filter(reservation -> reservation.getMember() != null
                        && ("member@library.com".equalsIgnoreCase(reservation.getMember().getEmail())
                                || "member2@library.com".equalsIgnoreCase(reservation.getMember().getEmail())))
                .toList();

        if (reservationsToRelease.isEmpty()) {
            return;
        }

        List<Book> booksToUpdate = new ArrayList<>();
        for (ReservationRecord reservation : reservationsToRelease) {
            reservation.setStatus(ReservationStatus.CANCELLED);
            reservation.setCancelledAt(LocalDateTime.now());
            Book book = reservation.getBook();
            book.setAvailableCopies(Math.min(book.getTotalCopies(), book.getAvailableCopies() + 1));
            booksToUpdate.add(book);
        }

        reservationRepository.saveAll(reservationsToRelease);
        bookRepository.saveAll(booksToUpdate);
    }

    private void seedReservations(BookRepository bookRepository, MemberRepository memberRepository,
            ReservationRepository reservationRepository) {
        if (reservationRepository.count() > 0) {
            return;
        }

        List<Book> books = bookRepository.findAll();
        List<Member> members = memberRepository.findAll().stream().filter(Member::isActive).toList();
        if (books.size() < 30 || members.size() < 4) {
            return;
        }

        Book reservedBook = books.get(24);
        Book waitlistedBook = books.get(25);

        ReservationRecord reserved = new ReservationRecord();
        reserved.setBook(reservedBook);
        reserved.setMember(members.get(2));
        reserved.setStatus(ReservationStatus.RESERVED);
        if (reservedBook.getAvailableCopies() > 0) {
            reservedBook.setAvailableCopies(reservedBook.getAvailableCopies() - 1);
        }

        ReservationRecord waitlisted = new ReservationRecord();
        waitlisted.setBook(waitlistedBook);
        waitlisted.setMember(members.get(3));
        waitlisted.setStatus(ReservationStatus.WAITLISTED);

        reservationRepository.saveAll(List.of(reserved, waitlisted));
        bookRepository.saveAll(List.of(reservedBook, waitlistedBook));
    }

    private Integer extractYear(String rawValue) {
        Matcher matcher = YEAR_PATTERN.matcher(rawValue == null ? "" : rawValue);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group());
        }
        return 2000;
    }

    private String extractLanguage(String bookStats) {
        if (bookStats == null || bookStats.isBlank()) {
            return "English";
        }
        for (String token : bookStats.split("\\|")) {
            String trimmed = token.trim();
            if (trimmed.toLowerCase(Locale.ROOT).startsWith("language")) {
                return clean(trimmed.replaceFirst("(?i)language", ""));
            }
        }
        return "English";
    }

    private double extractRating(String readingStats) {
        if (readingStats == null || readingStats.isBlank()) {
            return 4.0;
        }
        int signal = 0;
        for (String token : readingStats.split("\\|")) {
            String digits = token.replaceAll("[^0-9]", "");
            if (!digits.isBlank()) {
                signal += Integer.parseInt(digits);
            }
        }
        return Math.min(5.0, 4.0 + (signal / 20.0));
    }

    private String buildTags(String category, String language, String readingStats) {
        return String.join(",",
                clean(category).toLowerCase(Locale.ROOT).replace(' ', '-'),
                clean(language).toLowerCase(Locale.ROOT).replace(' ', '-'),
                readingStats != null && readingStats.contains("Want to read") ? "popular" : "catalog");
    }

    private String generatePseudoIsbn(String titleId, int sequence) {
        String source = (titleId == null ? "BOOK" : titleId).replaceAll("[^0-9]", "");
        if (source.length() >= 13) {
            return source.substring(0, 13);
        }
        return String.format(Locale.ROOT, "978%010d", Math.abs((source + sequence).hashCode()) % 1_000_000_0000L);
    }

    private String buildCoverUrl(String isbn) {
        if (isbn == null || isbn.isBlank()) {
            return "";
        }
        return "https://covers.openlibrary.org/b/isbn/" + isbn + "-L.jpg?default=false";
    }

    private boolean needsCoverRefresh(String coverUrl) {
        return coverUrl == null || coverUrl.isBlank() || !coverUrl.contains("?default=false");
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.replace("SociÃ©tÃ©", "Societe").trim();
    }
    private String limit(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
