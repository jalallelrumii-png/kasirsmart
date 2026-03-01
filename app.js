/**
 * app.js - Aplikasi Kasir Pro iOS
 * Fitur: Kasir, Manajemen Produk, Laporan, Export Excel, Export PDF, Cetak Struk
 * Dependencies: XLSX, jsPDF, jspdf-autotable (sudah include di HTML)
 */

document.addEventListener('DOMContentLoaded', function() {
    // ==================== DATA DEFAULT ====================
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

    // State global
    let products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // ==================== DOM ELEMENTS ====================
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    // Kasir
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

    // Produk (Manajemen)
    const produkTbody = document.getElementById('produkTbody');
    const modalProduk = document.getElementById('modalProduk');
    const modalProdukTitle = document.getElementById('modalProdukTitle');
    const produkNama = document.getElementById('produkNama');
    const produkHarga = document.getElementById('produkHarga');
    const produkKategori = document.getElementById('produkKategori');
    const produkStok = document.getElementById('produkStok');
    const simpanProdukBtn = document.getElementById('simpanProdukBtn');
    const batalProdukBtn = document.getElementById('batalProdukBtn');

    // Laporan
    const laporanTbody = document.getElementById('laporanTbody');
    const totalOmzetEl = document.getElementById('totalOmzet');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');

    // State untuk filter & edit
    let activeCategory = 'all';
    let searchQuery = '';
    let editingProductId = null;

    // ==================== FUNGSI BANTU ====================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatRupiah(angka) {
        return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Simpan data ke localStorage
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // ==================== NAVIGASI ====================
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            const viewId = item.dataset.view;
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');

            // Render ulang konten sesuai view
            if (viewId === 'produk-view') renderProdukTable();
            if (viewId === 'laporan-view') renderLaporanTable();
        });
    });

    // ==================== KASIR ====================
    function renderProducts() {
        let filtered = products;
        if (activeCategory !== 'all') {
            filtered = filtered.filter(p => p.category === activeCategory);
        }
        if (searchQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (filtered.length === 0) {
            productListEl.innerHTML = '<div class="empty-state">Tidak ada produk</div>';
            return;
        }

        let html = '';
        filtered.forEach(p => {
            html += `<div class="product-card" onclick="window.addToCart(${p.id})">
                <div class="product-name">${escapeHtml(p.name)}</div>
                <div class="product-price">Rp ${formatRupiah(p.price)}</div>
                <div class="product-stock">Stok: ${p.stock}</div>
            </div>`;
        });
        productListEl.innerHTML = html;
    }

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
            const p = products.find(prod => prod.id === item.id);
            if (!p) return; // produk mungkin sudah dihapus
            totalItems += item.qty;
            totalHarga += p.price * item.qty;

            html += `<div class="cart-item">
                <div class="cart-item-info">
                    <h4>${escapeHtml(p.name)}</h4>
                    <p>Rp ${formatRupiah(p.price)} x ${item.qty}</p>
                </div>
                <div class="cart-item-actions">
                    <button onclick="window.updateCart(${p.id}, -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="window.updateCart(${p.id}, 1)">+</button>
                    <button onclick="window.updateCart(${p.id}, 0)" style="color:#ff3b30;">🗑️</button>
                </div>
            </div>`;
        });

        cartItemsEl.innerHTML = html;
        totalItemsEl.textContent = totalItems;
        totalHargaEl.textContent = `Rp ${formatRupiah(totalHarga)}`;
    }

    // Fungsi global untuk diakses dari HTML
    window.addToCart = function(productId) {
        const p = products.find(p => p.id === productId);
        if (!p) return;
        if (p.stock <= 0) {
            alert('Stok habis!');
            return;
        }

        const existing = cart.find(item => item.id === productId);
        if (existing) {
            if (existing.qty < p.stock) {
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

    window.updateCart = function(productId, change) {
        const idx = cart.findIndex(item => item.id === productId);
        if (idx === -1) return;

        const p = products.find(p => p.id === productId);
        if (!p) return;

        if (change === 0) {
            // hapus item
            cart.splice(idx, 1);
        } else {
            const newQty = cart[idx].qty + change;
            if (newQty <= 0) {
                cart.splice(idx, 1);
            } else if (newQty <= p.stock) {
                cart[idx].qty = newQty;
            } else {
                alert('Stok tidak mencukupi!');
                return;
            }
        }

        saveCart();
        renderCart();
    };

    // Event listeners Kasir
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.cat;
            renderProducts();
        });
    });

    bayarBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Keranjang masih kosong!');
            return;
        }

        let total = 0;
        cart.forEach(item => {
            const p = products.find(p => p.id === item.id);
            if (p) total += p.price * item.qty;
        });

        modalTotal.textContent = `Rp ${formatRupiah(total)}`;
        jumlahBayar.value = '';
        kembalianEl.textContent = 'Rp 0';
        modalBayar.style.display = 'flex';
        jumlahBayar.focus();
    });

    prosesBayarBtn.addEventListener('click', () => {
        const total = parseInt(modalTotal.textContent.replace(/[^0-9]/g, ''));
        const bayar = parseInt(jumlahBayar.value);

        if (isNaN(bayar) || bayar < total) {
            alert('Jumlah bayar kurang!');
            return;
        }

        const kembalian = bayar - total;
        kembalianEl.textContent = `Rp ${formatRupiah(kembalian)}`;

        // Buat transaksi
        const transaction = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            items: cart.map(item => {
                const p = products.find(p => p.id === item.id);
                return {
                    name: p.name,
                    qty: item.qty,
                    price: p.price,
                    subtotal: p.price * item.qty
                };
            }),
            total: total,
            bayar: bayar,
            kembalian: kembalian
        };

        transactions.push(transaction);
        saveTransactions();

        // Kurangi stok produk
        cart.forEach(item => {
            const p = products.find(p => p.id === item.id);
            if (p) p.stock -= item.qty;
        });
        saveProducts();

        // Kosongkan keranjang
        cart = [];
        saveCart();

        // Render ulang
        renderProducts();
        renderCart();
        renderLaporanTable(); // update laporan jika sedang dibuka

        alert('Pembayaran berhasil!');

        // Tutup modal setelah 1.5 detik
        setTimeout(() => {
            modalBayar.style.display = 'none';
        }, 1500);
    });

    tutupModalBtn.addEventListener('click', () => {
        modalBayar.style.display = 'none';
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Kosongkan keranjang?')) {
            cart = [];
            saveCart();
            renderCart();
        }
    });

    // ==================== MANAJEMEN PRODUK ====================
    function renderProdukTable() {
        let html = '';
        products.forEach(p => {
            html += `<tr>
                <td>${escapeHtml(p.name)}</td>
                <td>Rp ${formatRupiah(p.price)}</td>
                <td>${p.category}</td>
                <td>${p.stock}</td>
                <td class="action-btns">
                    <button onclick="window.editProduk(${p.id})">✏️</button>
                    <button onclick="window.hapusProduk(${p.id})">🗑️</button>
                </td>
            </tr>`;
        });
        produkTbody.innerHTML = html;
    }

    window.editProduk = function(id) {
        const p = products.find(p => p.id === id);
        if (!p) return;
        editingProductId = id;
        modalProdukTitle.textContent = '✏️ Edit Produk';
        produkNama.value = p.name;
        produkHarga.value = p.price;
        produkKategori.value = p.category;
        produkStok.value = p.stock;
        modalProduk.style.display = 'flex';
    };

    window.hapusProduk = function(id) {
        if (confirm('Hapus produk ini?')) {
            products = products.filter(p => p.id !== id);
            saveProducts();
            renderProdukTable();
            renderProducts(); // update tampilan kasir
        }
    };

    window.openProdukModal = function() {
        editingProductId = null;
        modalProdukTitle.textContent = '➕ Tambah Produk';
        produkNama.value = '';
        produkHarga.value = '';
        produkKategori.value = 'makanan';
        produkStok.value = '';
        modalProduk.style.display = 'flex';
    };

    simpanProdukBtn.addEventListener('click', () => {
        const name = produkNama.value.trim();
        const price = parseInt(produkHarga.value);
        const category = produkKategori.value;
        const stock = parseInt(produkStok.value);

        if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
            alert('Isi data dengan benar!');
            return;
        }

        if (editingProductId) {
            // Edit produk
            const index = products.findIndex(p => p.id === editingProductId);
            if (index !== -1) {
                products[index] = { ...products[index], name, price, category, stock };
            }
        } else {
            // Tambah produk baru
            const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 9;
            products.push({ id: newId, name, price, category, stock });
        }

        saveProducts();
        modalProduk.style.display = 'none';
        renderProdukTable();
        renderProducts(); // update kasir
    });

    batalProdukBtn.addEventListener('click', () => {
        modalProduk.style.display = 'none';
    });

    // ==================== LAPORAN ====================
    function renderLaporanTable() {
        let html = '';
        let totalOmzet = 0;

        transactions.forEach(t => {
            totalOmzet += t.total;
            const itemsStr = t.items.map(i => `${i.name} x${i.qty}`).join(', ');
            html += `<tr>
                <td>${t.id}</td>
                <td>${t.date}</td>
                <td>${itemsStr}</td>
                <td>Rp ${formatRupiah(t.total)}</td>
                <td>Rp ${formatRupiah(t.bayar)}</td>
                <td>Rp ${formatRupiah(t.kembalian)}</td>
                <td><button onclick="window.cetakStruk(${t.id})" class="ios-button secondary" style="padding:6px 12px;">🖨️</button></td>
            </tr>`;
        });

        laporanTbody.innerHTML = html;
        totalOmzetEl.textContent = `Rp ${formatRupiah(totalOmzet)}`;
    }

    window.cetakStruk = function(id) {
        const t = transactions.find(t => t.id === id);
        if (!t) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head><title>Struk #${t.id}</title>
            <style>
                body { font-family: monospace; padding: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 5px; text-align: left; }
            </style>
            </head>
            <body>
                <h2>Struk Pembayaran</h2>
                <p>ID: ${t.id}</p>
                <p>Tanggal: ${t.date}</p>
                <table>
                    <tr><th>Item</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
                    ${t.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>Rp ${formatRupiah(i.price)}</td><td>Rp ${formatRupiah(i.subtotal)}</td></tr>`).join('')}
                </table>
                <p>Total: Rp ${formatRupiah(t.total)}</p>
                <p>Bayar: Rp ${formatRupiah(t.bayar)}</p>
                <p>Kembalian: Rp ${formatRupiah(t.kembalian)}</p>
                <p>Terima kasih!</p>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Export Excel
    exportExcelBtn.addEventListener('click', () => {
        const wsData = [['ID', 'Tanggal', 'Item', 'Total', 'Bayar', 'Kembalian']];
        transactions.forEach(t => {
            const itemsStr = t.items.map(i => `${i.name} x${i.qty}`).join(', ');
            wsData.push([t.id, t.date, itemsStr, t.total, t.bayar, t.kembalian]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
        XLSX.writeFile(wb, 'laporan_penjualan.xlsx');
    });

    // Export PDF
    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Laporan Penjualan', 14, 16);

        const tableData = transactions.map(t => [
            t.id,
            t.date,
            t.items.map(i => `${i.name} x${i.qty}`).join(', '),
            `Rp ${t.total}`,
            `Rp ${t.bayar}`,
            `Rp ${t.kembalian}`
        ]);

        doc.autoTable({
            head: [['ID', 'Tanggal', 'Item', 'Total', 'Bayar', 'Kembalian']],
            body: tableData,
            startY: 20,
        });

        doc.save('laporan_penjualan.pdf');
    });

    // ==================== INITIAL RENDER ====================
    renderProducts();
    renderCart();
    renderProdukTable();
    renderLaporanTable();

    // Pastikan data default tersimpan
    if (!localStorage.getItem('products')) {
        saveProducts();
    }
});
