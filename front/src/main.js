import { cozyAudio } from './audio.js';

// State Management
let booksData = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedBook = null;
let viewMode = 'shelf'; // 'shelf' | 'grid'

// DOM Elements
const woodenBookcase = document.getElementById('wooden-bookcase');
const coversGrid = document.getElementById('covers-grid');
const shelfView = document.getElementById('shelf-view');
const gridView = document.getElementById('grid-view');

const searchInput = document.getElementById('search-input');
const statusTabs = document.getElementById('status-tabs');
const view3dBtn = document.getElementById('view-3d');
const viewGridBtn = document.getElementById('view-grid');

const audioBtn = document.getElementById('btn-ambient-audio');
const audioLabel = document.getElementById('audio-label');

const bookModal = document.getElementById('book-modal');
const closeModalBtn = document.getElementById('close-modal');

const addModal = document.getElementById('add-modal');
const btnAddBook = document.getElementById('btn-add-book');
const closeAddModalBtn = document.getElementById('close-add-modal');
const addBookForm = document.getElementById('add-book-form');

// Header Stats
const statTotalBooks = document.getElementById('stat-total-books');
const statPagesRead = document.getElementById('stat-pages-read');
const statRawPdfs = document.getElementById('stat-raw-pdfs');

// Modal Elements
const modalCoverImg = document.getElementById('modal-cover-img');
const modalGenre = document.getElementById('modal-genre');
const modalTitle = document.getElementById('modal-title');
const modalAuthor = document.getElementById('modal-author');
const modalRating = document.getElementById('modal-rating');
const modalDescription = document.getElementById('modal-description');
const modalQuote = document.getElementById('modal-quote');
const modalProgressText = document.getElementById('modal-progress-text');
const modalProgressFill = document.getElementById('modal-progress-fill');
const modalProgressSlider = document.getElementById('modal-progress-slider');
const modalFavBtn = document.getElementById('modal-fav-btn');
const modalStatusSelect = document.getElementById('modal-status-select');
const modalTags = document.getElementById('modal-tags');

// PDF Download & Preview Elements
const modalFileActions = document.getElementById('modal-file-actions');
const modalDownloadLink = document.getElementById('modal-download-link');
const modalFileSize = document.getElementById('modal-file-size');
const modalPreviewBtn = document.getElementById('modal-preview-btn');
const pdfPreviewBox = document.getElementById('pdf-preview-box');
const pdfIframe = document.getElementById('pdf-iframe');
const closePdfPreviewBtn = document.getElementById('close-pdf-preview');

// Helper: Render SVG Star Rating
function renderStarRating(rating = 5) {
  const max = 5;
  let html = '<span class="star-rating-container">';
  for (let i = 1; i <= max; i++) {
    const isFilled = i <= rating;
    html += `<svg class="star-icon ${isFilled ? 'filled' : 'empty'}" width="14" height="14" viewBox="0 0 24 24" fill="${isFilled ? 'var(--accent-gold)' : 'none'}" stroke="var(--accent-gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  html += '</span>';
  return html;
}

// Initialize Application
async function initApp() {
  await loadDataLakeFeed();
  setupEventListeners();
  render();
}

// Fetch Data Lake Feed
async function loadDataLakeFeed() {
  try {
    const res = await fetch('/datalake/processed/books.json');
    if (!res.ok) throw new Error('Data lake fetch failed');
    booksData = await res.json();
  } catch (err) {
    console.warn('Fallback to default data lake records:', err);
    booksData = getFallbackData();
  }
}

// Render Header Stats
function updateHeaderStats() {
  const total = booksData.length;
  const pagesRead = booksData.reduce((acc, b) => acc + (b.pages_read || 0), 0);
  const rawCount = booksData.filter(b => b.file_path).length;
  
  if (statTotalBooks) statTotalBooks.textContent = total;
  if (statPagesRead) statPagesRead.textContent = pagesRead.toLocaleString();
  if (statRawPdfs) statRawPdfs.textContent = rawCount;
}

// Filter Books
function getFilteredBooks() {
  return booksData.filter(book => {
    // Status Filter
    let matchesStatus = true;
    if (currentFilter === 'favorite') {
      matchesStatus = book.favorite === true;
    } else if (currentFilter !== 'all') {
      matchesStatus = book.status === currentFilter;
    }

    // Search Query
    let matchesSearch = true;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = book.title.toLowerCase().includes(q);
      const authorMatch = book.author.toLowerCase().includes(q);
      const genreMatch = (book.genre || '').toLowerCase().includes(q);
      const tagMatch = (book.tags || []).some(t => t.toLowerCase().includes(q));
      const fileMatch = (book.file_path || '').toLowerCase().includes(q);
      matchesSearch = titleMatch || authorMatch || genreMatch || tagMatch || fileMatch;
    }

    return matchesStatus && matchesSearch;
  });
}

// Main Render Function
function render() {
  updateHeaderStats();
  const filtered = getFilteredBooks();

  if (viewMode === 'shelf') {
    render3DBookshelf(filtered);
  } else {
    renderGridCovers(filtered);
  }
}

// Render 3D Wooden Bookshelf View
function render3DBookshelf(books) {
  woodenBookcase.innerHTML = '';

  if (books.length === 0) {
    woodenBookcase.innerHTML = `<div class="empty-shelf-msg" style="padding: 40px; text-align: center; color: var(--text-muted);">No books match your current filter or search.</div>`;
    return;
  }

  const BOOKS_PER_SHELF = 6;
  const shelfCount = Math.ceil(books.length / BOOKS_PER_SHELF);

  for (let s = 0; s < shelfCount; s++) {
    const shelfRow = document.createElement('div');
    shelfRow.className = 'shelf-row';

    const shelfBooks = books.slice(s * BOOKS_PER_SHELF, (s + 1) * BOOKS_PER_SHELF);

    shelfBooks.forEach(book => {
      const spineWrapper = document.createElement('div');
      spineWrapper.className = 'book-spine-wrapper';
      spineWrapper.addEventListener('click', () => openBookModal(book));

      const spine = document.createElement('div');
      spine.className = 'book-spine';
      spine.style.backgroundColor = book.spine_color || '#3b281c';

      spine.innerHTML = `
        ${book.favorite ? '<span class="spine-favorite-star"><svg width="12" height="12" viewBox="0 0 24 24" fill="#e63946"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>' : ''}
        <span class="spine-title">${book.title}</span>
        <span class="spine-author">${book.author.split(' ').pop()}</span>
      `;

      spineWrapper.appendChild(spine);
      shelfRow.appendChild(spineWrapper);
    });

    const plank = document.createElement('div');
    plank.className = 'shelf-plank';
    shelfRow.appendChild(plank);

    woodenBookcase.appendChild(shelfRow);
  }
}

// Render Grid View
function renderGridCovers(books) {
  coversGrid.innerHTML = '';

  if (books.length === 0) {
    coversGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No books found.</div>`;
    return;
  }

  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.addEventListener('click', () => openBookModal(book));

    const coverSrc = book.cover_image || '/cover_images/placeholders/default_placeholder.svg';

    const statusLabel = {
      'completed': 'Finished',
      'currently-reading': 'Reading',
      'want-to-read': 'Wishlist'
    }[book.status] || book.status;

    const statusClass = `status-${book.status}`;

    card.innerHTML = `
      <div class="card-cover-wrapper">
        ${book.file_path ? '<span class="raw-pdf-tag"><svg class="cozy-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF FILE</span>' : ''}
        <img src="${coverSrc}" alt="${book.title}" loading="lazy" />
      </div>
      <h3 class="card-title">${book.title}</h3>
      <p class="card-author">${book.author}</p>
      <div class="card-meta">
        <span class="badge-status ${statusClass}">${statusLabel}</span>
        <span>${renderStarRating(book.rating || 0)}</span>
      </div>
    `;

    coversGrid.appendChild(card);
  });
}

// Open Book Modal (Open Book & PDF Viewer)
function openBookModal(book) {
  selectedBook = book;
  
  modalCoverImg.src = book.cover_image || '/cover_images/placeholders/default_placeholder.svg';
  modalGenre.textContent = book.genre || 'General Literature';
  modalTitle.textContent = book.title;
  modalAuthor.textContent = `by ${book.author}`;
  modalRating.innerHTML = renderStarRating(book.rating || 5);
  modalDescription.textContent = book.description || 'No description provided.';
  
  // Reset PDF Viewer state
  pdfPreviewBox.classList.add('hidden');
  pdfIframe.src = '';

  // File Download & Preview Controls
  if (book.file_path) {
    modalFileActions.style.display = 'flex';
    modalDownloadLink.href = `/${book.file_path}`;
    modalDownloadLink.download = `${book.title}.pdf`;
    modalFileSize.textContent = `${book.file_size_mb || '1.2'} MB`;
  } else {
    modalFileActions.style.display = 'none';
  }

  if (book.quote) {
    modalQuote.textContent = `"${book.quote}"`;
    document.getElementById('modal-quote-box').style.display = 'block';
  } else {
    document.getElementById('modal-quote-box').style.display = 'none';
  }

  // Progress Bar
  const totalPages = book.pages || 100;
  const readPages = book.pages_read || 0;
  const percent = Math.min(100, Math.round((readPages / totalPages) * 100));

  modalProgressText.textContent = `${readPages} / ${totalPages} pages (${percent}%)`;
  modalProgressFill.style.width = `${percent}%`;
  modalProgressSlider.value = percent;

  // Favorite toggle button
  modalFavBtn.style.background = book.favorite ? '#e63946' : '#6c757d';
  modalFavBtn.innerHTML = book.favorite
    ? '<svg class="cozy-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Favorite'
    : '<svg class="cozy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Mark Favorite';

  // Status Selector
  modalStatusSelect.value = book.status;

  // Tags
  modalTags.innerHTML = (book.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join('');

  bookModal.classList.remove('hidden');
}

// Event Listeners Setup
function setupEventListeners() {
  // Navigation Tabs
  statusTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-tab')) {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.status;
      render();
    }
  });

  // Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  // View Mode Toggles
  view3dBtn.addEventListener('click', () => {
    viewMode = 'shelf';
    view3dBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    shelfView.classList.remove('hidden');
    gridView.classList.add('hidden');
    render();
  });

  viewGridBtn.addEventListener('click', () => {
    viewMode = 'grid';
    viewGridBtn.classList.add('active');
    view3dBtn.classList.remove('active');
    gridView.classList.remove('hidden');
    shelfView.classList.add('hidden');
    render();
  });

  // Theme Switches
  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
      e.target.classList.add('active');
      const theme = e.target.dataset.setTheme;
      document.documentElement.setAttribute('data-theme', theme);
    });
  });

  // Audio Toggle
  audioBtn.addEventListener('click', () => {
    const isPlaying = cozyAudio.toggle();
    if (isPlaying) {
      audioLabel.textContent = 'Fireplace Playing';
      audioBtn.style.borderColor = 'var(--accent-gold)';
    } else {
      audioLabel.textContent = 'Sound Off';
      audioBtn.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    }
  });

  // Modal Close
  closeModalBtn.addEventListener('click', () => {
    bookModal.classList.add('hidden');
    pdfIframe.src = '';
  });

  bookModal.addEventListener('click', (e) => {
    if (e.target === bookModal) {
      bookModal.classList.add('hidden');
      pdfIframe.src = '';
    }
  });

  // PDF Preview Button Trigger
  modalPreviewBtn.addEventListener('click', () => {
    if (!selectedBook || !selectedBook.file_path) return;
    pdfIframe.src = `/${selectedBook.file_path}`;
    pdfPreviewBox.classList.remove('hidden');
  });

  closePdfPreviewBtn.addEventListener('click', () => {
    pdfPreviewBox.classList.add('hidden');
    pdfIframe.src = '';
  });

  // Favorite Button inside Modal
  modalFavBtn.addEventListener('click', () => {
    if (!selectedBook) return;
    selectedBook.favorite = !selectedBook.favorite;
    openBookModal(selectedBook);
    render();
  });

  // Status Select inside Modal
  modalStatusSelect.addEventListener('change', (e) => {
    if (!selectedBook) return;
    selectedBook.status = e.target.value;
    render();
  });

  // Progress Slider inside Modal
  modalProgressSlider.addEventListener('input', (e) => {
    if (!selectedBook) return;
    const percent = parseInt(e.target.value, 10);
    const totalPages = selectedBook.pages || 100;
    selectedBook.pages_read = Math.round((percent / 100) * totalPages);
    
    if (percent === 100) {
      selectedBook.status = 'completed';
      modalStatusSelect.value = 'completed';
    } else if (percent > 0 && selectedBook.status === 'want-to-read') {
      selectedBook.status = 'currently-reading';
      modalStatusSelect.value = 'currently-reading';
    }

    modalProgressText.textContent = `${selectedBook.pages_read} / ${totalPages} pages (${percent}%)`;
    modalProgressFill.style.width = `${percent}%`;

    updateHeaderStats();
  });

  // Add Book Modal Triggers
  btnAddBook.addEventListener('click', () => addModal.classList.remove('hidden'));
  closeAddModalBtn.addEventListener('click', () => addModal.classList.add('hidden'));
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) addModal.classList.add('hidden');
  });

  // Add Book Form Submit
  addBookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const filePathInput = document.getElementById('form-file-path').value.trim();
    const formattedFilePath = filePathInput ? (filePathInput.startsWith('datalake/raw/') ? filePathInput : `datalake/raw/${filePathInput}`) : null;

    const newBook = {
      id: `book-${Date.now()}`,
      title: document.getElementById('form-title').value,
      author: document.getElementById('form-author').value,
      genre: document.getElementById('form-genre').value || 'Fiction',
      status: document.getElementById('form-status').value,
      pages: parseInt(document.getElementById('form-pages').value, 10) || 250,
      pages_read: document.getElementById('form-status').value === 'completed' ? parseInt(document.getElementById('form-pages').value, 10) : 0,
      rating: 5,
      favorite: true,
      spine_color: getRandomSpineColor(),
      cover_image: '/cover_images/placeholders/default_placeholder.svg',
      file_path: formattedFilePath,
      file_size_mb: formattedFilePath ? 2.5 : null,
      description: document.getElementById('form-description').value,
      quote: document.getElementById('form-quote').value,
      date_added: new Date().toISOString().split('T')[0],
      tags: ['raw-ingested']
    };

    booksData.unshift(newBook);
    addBookForm.reset();
    addModal.classList.add('hidden');
    render();
  });
}

function getRandomSpineColor() {
  const colors = ['#2c3e50', '#8b4513', '#2e8b57', '#4682b4', '#d2691e', '#8a2be2', '#b8860b', '#1e90ff', '#522566'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getFallbackData() {
  return [
    {
      id: "raw-the_cozy_reader_handbook",
      title: "The Cozy Reader Handbook",
      author: "Gisela Belmonte",
      genre: "PDF Document",
      pages: 150,
      pages_read: 45,
      status: "currently-reading",
      rating: 5,
      favorite: true,
      spine_color: "#1e3d59",
      cover_image: "/cover_images/thumbnails/the_cozy_reader_handbook_cover.png",
      file_path: "datalake/raw/the_cozy_reader_handbook.pdf",
      file_size_mb: 0.8,
      description: "Original PDF document in datalake/raw/",
      quote: "Extracted directly from datalake/raw/"
    }
  ];
}

document.addEventListener('DOMContentLoaded', initApp);
