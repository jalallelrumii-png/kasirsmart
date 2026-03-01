// ==================== DATA PRODUK (CONTOH) ====================
// Data default jika localStorage kosong
const defaultProducts = [
  { id: 1, name: 'Nasi Goreng', price: 25000, category: 'makanan', stock: 50 },
  { id: 2, name: 'Mie Goreng', price: 20000, category: 'makanan', stock: 40 },
  { id: 3, name: 'Ayam Bakar', price: 35000, category: 'makanan', stock: 30 },
  { id: 4, name: 'Es Teh', price: 5000, category: 'minuman', stock: 100 },
  { id: 5, name: 'Es Jeruk', price: 7000, category: 'minuman', stock: 80 },
  { id: 6, name: 'Kopi', price: 8000, category: 'minuman', stock: 60 },
  { id: 7, name: 'Kentang Goreng', price: 15000, category: 'snack', stock: 50 },
  { id: 8, name: 'Pisang Goreng', price: 10000, category: 'snack', stock: 40 }
];

// Inisialisasi data produk dari localStorage atau default
let products = JSON.parse(localStorage.getItem('products')) || defaultProducts;

// Keranjang belanja
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Elemen DOM
const productListEl = document.getElementById('productList');
const cartItemsEl = document.getElementById('cartItems');
const totalItemsEl = document.getElementById('totalItems');
const totalHargaEl = document.getElementById('totalHarga');
const searchInput = document.getElementById('searchInput');
const categoryBtns = document.querySelectorAll('.category-btn');
const bayarBtn = document.getElementById('bayarBtn');
const resetBtn = document.getElementById('resetBtn');
const modalBayar = document.getElementById('modalBayar');
const modalTotal = document.getElementById('modalTotal');
const jumlahBayar = document.getElementById('jumlahBayar');
const kembalianEl = document.getElementById('kembalian');
const prosesBayarBtn = document.getElementById('prosesBayarBtn');
const tutupModalBtn = document.getElementById('tutupModalBtn');

// State untuk filter dan pencarian
let activeCategory = 'all';
let searchQuery = '';

// ==================== RENDER PRODUK ====================
function renderProducts() {
  let filteredProducts = products;

  // Filter berdasarkan kategori
  if (activeCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === activeCategory);
  }

  // Filter berdasarkan pencarian
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filteredProducts.length === 0) {
    productListEl.innerHTML = '<div class="empty-state">Tidak ada produk</div>';
    return;
  }

  let html = '';
  filteredProducts.forEach(product => {
    html += `
      <div class="product-card" onclick="addToCart(${product.id})">
        <div class="product-name">${escapeHtml(product.name)}</div>
        <div class="product-price">Rp ${formatRupiah(product.price)}</div>
        <div class="product-stock">Stok: ${product.stock}</div>
      </div>
    `;
  });
  productListEl.innerHTML = html;
}

// Escape HTML untuk keamanan
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Format angka ke Rupiah
function formatRupiah(angka) {
  return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ==================== RENDER KERANJANG ====================
function renderCart() {
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<div class="empty-state">Keranjang kosong</div>';
    totalItemsEl.textContent = '0';
    totalHargaEl.textContent = 'Rp 0';
    return;
  }

  let html = '';
  let totalItems = 0;
  let totalHarga = 0;

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return; // produk mungkin sudah dihapus
    totalItems += item.qty;
    totalHarga += product.price * item.qty;

    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${escapeHtml(product.name)}</h4>
          <p>Rp ${formatRupiah(product.price)} x ${item.qty}</p>
        </div>
        <div class="cart-item-actions">
          <button onclick="updateCart(${product.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateCart(${product.id}, 1)">+</button>
          <button onclick="updateCart(${product.id}, 0)" style="color:#ff3b30;">🗑️</button>
        </div>
      </div>
    `;
  });

  cartItemsEl.innerHTML = html;
  totalItemsEl.textContent = totalItems;
  totalHargaEl.textContent = `Rp ${formatRupiah(totalHarga)}`;
}

// ==================== TAMBAH KE KERANJANG ====================
window.addToCart = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  if (product.stock <= 0) {
    alert('Stok habis!');
    return;
  }

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (existing.qty < product.stock) {
      existing.qty += 1;
    } else {
      alert('Stok tidak mencukupi!');
      return;
    }
  } else {
    cart.push({ id: productId, qty: 1 });
  }

  saveCart();
  renderCart();
};

// ==================== UPDATE KERANJANG ====================
window.updateCart = function(productId, change) {
  const index = cart.findIndex(item => item.id === productId);
  if (index === -1) return;

  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (change === 0) {
    // hapus item
    cart.splice(index, 1);
  } else {
    const newQty = cart[index].qty + change;
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else if (newQty <= product.stock) {
      cart[index].qty = newQty;
    } else {
      alert('Stok tidak mencukupi!');
    }
  }

  saveCart();
  renderCart();
};

// Simpan keranjang ke localStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// ==================== EVENT LISTENER ====================
// Pencarian
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderProducts();
});

// Filter kategori
categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.cat;
    renderProducts();
  });
});

// Tombol Bayar
bayarBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Keranjang masih kosong!');
    return;
  }

  // Hitung total
  let total = 0;
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) total += product.price * item.qty;
  });

  modalTotal.textContent = `Rp ${formatRupiah(total)}`;
  jumlahBayar.value = '';
  kembalianEl.textContent = 'Rp 0';
  modalBayar.style.display = 'flex';
  jumlahBayar.focus();
});

// Proses Bayar
prosesBayarBtn.addEventListener('click', () => {
  const total = parseInt(modalTotal.textContent.replace(/[^0-9]/g, ''));
  const bayar = parseInt(jumlahBayar.value);

  if (isNaN(bayar) || bayar < total) {
    alert('Jumlah bayar kurang!');
    return;
  }

  const kembalian = bayar - total;
  kembalianEl.textContent = `Rp ${formatRupiah(kembalian)}`;

  // Simpan transaksi (contoh, bisa dikembangkan)
  const transaction = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    items: cart.map(item => {
      const product = products.find(p => p.id === item.id);
      return {
        name: product.name,
        qty: item.qty,
        price: product.price,
        subtotal: product.price * item.qty
      };
    }),
    total: total,
    bayar: bayar,
    kembalian: kembalian
  };

  // Simpan riwayat transaksi ke localStorage
  let history = JSON.parse(localStorage.getItem('transactions')) || [];
  history.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(history));

  // Kurangi stok produk
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) {
      product.stock -= item.qty;
    }
  });
  localStorage.setItem('products', JSON.stringify(products));

  // Kosongkan keranjang
  cart = [];
  saveCart();

  // Render ulang
  renderProducts();
  renderCart();

  alert('Pembayaran berhasil!');

  // Tutup modal setelah 2 detik
  setTimeout(() => {
    modalBayar.style.display = 'none';
  }, 2000);
});

// Tutup modal
tutupModalBtn.addEventListener('click', () => {
  modalBayar.style.display = 'none';
});

// Reset keranjang
resetBtn.addEventListener('click', () => {
  if (confirm('Kosongkan keranjang?')) {
    cart = [];
    saveCart();
    renderCart();
  }
});

// Tombol Laporan (bisa diisi fitur riwayat nanti)
document.getElementById('btnLaporan').addEventListener('click', () => {
  alert('Fitur laporan akan segera hadir!');
});

// ==================== INITIAL RENDER ====================
renderProducts();
renderCart();
