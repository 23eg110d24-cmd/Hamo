const bookCovers = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800',
];

export const mockUsersByEmail = {
  'admin@library.com': {
    id: 'admin-1',
    name: 'System Admin',
    email: 'admin@library.com',
    role: 'ADMIN',
    phone: '9999999991',
    department: 'Administration',
  },
  'librarian@library.com': {
    id: 'librarian-1',
    name: 'Jane Smith',
    email: 'librarian@library.com',
    role: 'LIBRARIAN',
    phone: '9999999992',
    department: 'Library Operations',
  },
  'member@library.com': {
    id: 'member-1',
    name: 'Alice Johnson',
    email: 'member@library.com',
    role: 'MEMBER',
    phone: '9999999993',
    department: 'Computer Science',
  },
};

export const mockCredentials = {
  'admin@library.com': 'Admin@123',
  'librarian@library.com': 'Librarian@123',
  'member@library.com': 'Member@123',
};

export const mockBooks = [
  {
    id: '978-0-09-957807-9',
    isbn: '978-0-09-957807-9',
    title: 'A Game of Thrones',
    author: 'George R.R. Martin',
    publisher: 'Bantam',
    category: 'Fantasy',
    language: 'English',
    publishedYear: 1996,
    availableCopies: 4,
    totalCopies: 6,
    averageRating: 4.8,
    rentalPrice: 7.5,
    coverUrl: bookCovers[0],
    description: 'The first entry in a sprawling fantasy saga of power, houses, and political intrigue.',
  },
  {
    id: '978-0-14-044930-3',
    isbn: '978-0-14-044930-3',
    title: 'The Histories',
    author: 'Herodotus',
    publisher: 'Penguin Classics',
    category: 'History',
    language: 'English',
    publishedYear: -440,
    availableCopies: 2,
    totalCopies: 5,
    averageRating: 4.2,
    rentalPrice: 5.5,
    coverUrl: bookCovers[1],
    description: 'An enduring foundational work that chronicles the Greco-Persian Wars and the cultures around them.',
  },
  {
    id: '978-0-14-118776-1',
    isbn: '978-0-14-118776-1',
    title: 'One Hundred Years of Solitude',
    author: 'Gabriel Garcia Marquez',
    publisher: 'Penguin Books',
    category: 'Literary Fiction',
    language: 'English',
    publishedYear: 1967,
    availableCopies: 3,
    totalCopies: 4,
    averageRating: 4.7,
    rentalPrice: 6.5,
    coverUrl: bookCovers[2],
    description: 'A landmark magical realist novel tracing generations of the Buendia family.',
  },
  {
    id: '978-0-141-44171-6',
    isbn: '978-0-141-44171-6',
    title: 'Jane Eyre',
    author: 'Charlotte Bronte',
    publisher: 'Penguin Classics',
    category: 'Classic',
    language: 'English',
    publishedYear: 1847,
    availableCopies: 0,
    totalCopies: 3,
    averageRating: 4.5,
    rentalPrice: 4,
    coverUrl: bookCovers[3],
    description: 'A gothic coming-of-age classic that blends romance, mystery, and moral courage.',
  },
  {
    id: '978-0-553-29698-2',
    isbn: '978-0-553-29698-2',
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    publisher: 'Little, Brown and Company',
    category: 'Classic',
    language: 'English',
    publishedYear: 1951,
    availableCopies: 1,
    totalCopies: 3,
    averageRating: 4.1,
    rentalPrice: 4.5,
    coverUrl: bookCovers[4],
    description: 'Holden Caulfield’s restless, iconic journey through grief, alienation, and adolescence.',
  },
  {
    id: '978-0-307-58837-1',
    isbn: '978-0-307-58837-1',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    publisher: 'Harper',
    category: 'History',
    language: 'English',
    publishedYear: 2011,
    availableCopies: 2,
    totalCopies: 5,
    averageRating: 4.6,
    rentalPrice: 8,
    coverUrl: bookCovers[5],
    description: 'A sweeping narrative of human history from cognitive revolution to modern systems.',
  },
];

export const mockMembers = [
  {
    id: 'C101',
    name: 'Alice Johnson',
    email: 'member@library.com',
    address: '123 Main St',
    registeredAt: '2021-05-15',
    phone: '9999999993',
    department: 'Computer Science',
  },
  {
    id: 'C102',
    name: 'Bob Smith',
    email: 'bob.smith@library.com',
    address: '456 Elm St',
    registeredAt: '2021-06-20',
    phone: '9999999994',
    department: 'Mathematics',
  },
  {
    id: 'C103',
    name: 'Carol Davis',
    email: 'carol.davis@library.com',
    address: '789 Oak St',
    registeredAt: '2021-07-10',
    phone: '9999999995',
    department: 'History',
  },
  {
    id: 'C104',
    name: 'Dave Wilson',
    email: 'dave.wilson@library.com',
    address: '567 Pine St',
    registeredAt: '2021-08-05',
    phone: '9999999996',
    department: 'Literature',
  },
];

export const mockIssues = [
  {
    id: 'IS101',
    memberId: 'C101',
    issueDate: '2023-05-01',
    dueDate: '2023-05-15',
    status: 'OVERDUE',
    fineAmount: 120,
    finePaid: false,
    book: getBookByIsbn('978-0-553-29698-2'),
  },
  {
    id: 'IS102',
    memberId: 'C102',
    issueDate: '2023-05-02',
    dueDate: '2023-05-16',
    status: 'RETURNED',
    fineAmount: 0,
    finePaid: true,
    book: createFallbackBook('978-0-7432-4722-4', 'The Da Vinci Code', 'Mystery'),
  },
  {
    id: 'IS103',
    memberId: 'C103',
    issueDate: '2023-05-03',
    dueDate: '2023-05-17',
    status: 'ACTIVE',
    fineAmount: 0,
    finePaid: false,
    book: createFallbackBook('978-0-7432-7357-1', '1491: New Revelations of the Americas Before Columbus', 'History'),
  },
  {
    id: 'IS104',
    memberId: 'C104',
    issueDate: '2023-05-04',
    dueDate: '2023-05-18',
    status: 'OVERDUE',
    fineAmount: 80,
    finePaid: false,
    book: getBookByIsbn('978-0-307-58837-1'),
  },
];

export const mockRecommendations = [
  {
    bookId: '978-0-14-118776-1',
    title: 'One Hundred Years of Solitude',
    author: 'Gabriel Garcia Marquez',
    category: 'Literary Fiction',
    score: 0.94,
    reason: 'Readers who borrow modern classics often continue into rich multigenerational fiction.',
    coverUrl: bookCovers[2],
  },
  {
    bookId: '978-0-14-044930-3',
    title: 'The Histories',
    author: 'Herodotus',
    category: 'History',
    score: 0.88,
    reason: 'Your issue history includes narrative nonfiction and world history titles.',
    coverUrl: bookCovers[1],
  },
  {
    bookId: '978-0-09-957807-9',
    title: 'A Game of Thrones',
    author: 'George R.R. Martin',
    category: 'Fantasy',
    score: 0.82,
    reason: 'Popular among members who also enjoy immersive long-form fiction.',
    coverUrl: bookCovers[0],
  },
];

export function getMockUserByCredentials(email, password) {
  const expectedPassword = mockCredentials[email];
  if (!expectedPassword || expectedPassword !== password) {
    return null;
  }

  return mockUsersByEmail[email] || null;
}

export function getMockMemberProfile(user) {
  const fromSeededUser = user?.email ? mockUsersByEmail[user.email] : null;
  if (fromSeededUser) {
    return fromSeededUser;
  }

  const fromMember = mockMembers.find(
    (member) => member.id === user?.id || member.email === user?.email,
  );

  return fromMember || null;
}

function getBookByIsbn(isbn) {
  return mockBooks.find((book) => book.isbn === isbn) || createFallbackBook(isbn, isbn, 'General');
}

function createFallbackBook(isbn, title, category) {
  return {
    id: isbn,
    isbn,
    title,
    author: 'Unknown Author',
    publisher: 'Dataset Import',
    category,
    language: 'English',
    publishedYear: 2018,
    availableCopies: 1,
    totalCopies: 2,
    averageRating: 4.1,
    rentalPrice: 5,
    coverUrl: bookCovers[0],
    description: 'Imported from the provided library dataset as mock catalog data.',
  };
}
