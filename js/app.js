// ============================================
// APP PRINCIPAL - SISTEMA OXIPUR
// CON LOADER, ANIMACIONES Y ESTILO MEJORADO
// ============================================

// Estado global de la aplicación
const appState = {
    inventory: [],
    currentPage: 1,
    itemsPerPage: 10,
    filters: {
        search: '',
        status: 'all'
    },
    charts: {},
    isLoading: true
};

// ============================================
// LOADER Y ANIMACIONES
// ============================================

// Mostrar loader
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
}

// Ocultar loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500); // Pequeña demora para que se vea la transición
    }
}

// Animación de entrada para elementos
function animateElements() {
    const cards = document.querySelectorAll('.card-animate');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('show');
        }, index * 100);
    });
}

// ============================================
// CARGA DESDE ARCHIVO JSON EXTERNO
// ============================================

// Cargar datos desde el archivo JSON
async function loadFromJSON() {
    showLoader();
    
    try {
        // Limpiar localStorage si hay parámetro en URL (para pruebas)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('reset')) {
            localStorage.removeItem('oxipur_inventory');
            console.log('localStorage limpiado');
        }
        
        // Intentar cargar desde localStorage
        const stored = localStorage.getItem('oxipur_inventory');
        
        if (stored) {
            // Verificar si lo que hay en localStorage NO es un array vacío
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) {
                appState.inventory = parsed;
                console.log('Datos cargados desde localStorage:', appState.inventory.length, 'registros');
            } else {
                // Si hay array vacío en localStorage, cargar desde JSON
                await loadFromJSONFile();
            }
        } else {
            // No hay datos en localStorage, cargar desde JSON
            await loadFromJSONFile();
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
        appState.inventory = [];
        await loadFromJSONFile();
    }
    
    // Renderizar todo
    renderInventoryTable();
    renderCharts();
    animateElements();
    hideLoader();
}

// Cargar desde archivo JSON (versión para file://)
async function loadFromJSONFile() {
    try {
        console.log('Usando datos por defecto (modo file://)');
        
        // Datos por defecto VACÍOS
        appState.inventory = [];
        
        // Si QUIERES datos de ejemplo para probar, descomenta esto:
        /*
        appState.inventory = [
            {
                id: "1",
                serialNumber: "OX-2024-001",
                cylinderSize: "5.0",
                amount: "150.00",
                clientName: "Cliente Demo",
                datetime: new Date().toLocaleDateString() + ", 09:30",
                status: "Entregado",
                owner: "Cliente"
            }
        ];
        */
        
        console.log('Datos cargados:', appState.inventory.length, 'registros');
        saveToJSON();
    } catch (error) {
        console.error('Error:', error);
        appState.inventory = [];
        saveToJSON();
    }
}

// Guardar datos en localStorage
function saveToJSON() {
    try {
        localStorage.setItem('oxipur_inventory', JSON.stringify(appState.inventory));
        console.log('Datos guardados en localStorage');
    } catch (error) {
        console.error('Error guardando datos:', error);
        showNotification('Error al guardar los datos', 'error');
    }
}

// ============================================
// NOTIFICACIONES
// ============================================

function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================

// Actualizar fecha y hora
function updateDateTime() {
    const datetimeInput = document.getElementById('datetime');
    if (!datetimeInput) return;
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    datetimeInput.value = `${day}/${month}/${year}, ${hours}:${minutes}`;
}

// ============================================
// FUNCIONES DE FILTRADO Y TABLA
// ============================================

// Obtener inventario filtrado
function getFilteredInventory() {
    return appState.inventory.filter(item => {
        const searchTerm = appState.filters.search.toLowerCase();
        const searchMatch = !searchTerm || 
            item.serialNumber.toLowerCase().includes(searchTerm) ||
            item.clientName.toLowerCase().includes(searchTerm);
        
        let statusMatch = true;
        if (appState.filters.status !== 'all') {
            const isDelivered = appState.filters.status === 'delivered';
            statusMatch = isDelivered ? 
                item.status === 'Entregado' : 
                item.status === 'Para Relleno';
        }
        
        return searchMatch && statusMatch;
    });
}

// Renderizar tabla de inventario
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    const recordsCount = document.getElementById('records-count');
    
    if (!tbody) return;
    
    const filtered = getFilteredInventory();
    recordsCount.textContent = filtered.length;
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fas fa-box-open text-5xl mb-3 opacity-30"></i>
                        <p class="text-lg font-medium">No hay registros disponibles</p>
                        <p class="text-sm opacity-70">Agrega un nuevo registro usando el formulario</p>
                    </div>
                </td>
            </tr>
        `;
        renderPagination(1);
        return;
    }
    
    const totalPages = Math.ceil(filtered.length / appState.itemsPerPage);
    const start = (appState.currentPage - 1) * appState.itemsPerPage;
    const end = start + appState.itemsPerPage;
    const pageItems = filtered.slice(start, end);
    
    tbody.innerHTML = pageItems.map((item, index) => `
        <tr class="hover:bg-gray-50 transition-all duration-200 hover:shadow-sm" style="animation: slideInRow 0.3s ease-out ${index * 0.05}s both;">
            <td class="px-4 py-3 font-medium">${item.serialNumber}</td>
            <td class="px-4 py-3">${item.cylinderSize} m³</td>
            <td class="px-4 py-3">
                ${item.amount ? `Bs ${parseFloat(item.amount).toFixed(2)}` : '-'}
            </td>
            <td class="px-4 py-3">${item.clientName}</td>
            <td class="px-4 py-3">
                <span class="status-badge ${item.status === 'Entregado' ? 'status-delivered' : 'status-refill'}">
                    <i class="fas fa-${item.status === 'Entregado' ? 'check-circle' : 'clock'}"></i>
                    ${item.status}
                </span>
            </td>
            <td class="px-4 py-3">
                <span class="inline-flex items-center">
                    <i class="fas fa-${item.owner === 'Oxipur' ? 'building' : 'user'} mr-1 text-gray-400"></i>
                    ${item.owner}
                </span>
            </td>
        </tr>
    `).join('');
    
    renderPagination(totalPages);
}

// Renderizar paginación
function renderPagination(totalPages) {
    const paginationDiv = document.getElementById('pagination-numbers');
    if (!paginationDiv) return;
    
    if (totalPages <= 1) {
        paginationDiv.innerHTML = `
            <button class="pagination-btn page-active" data-page="1">1</button>
        `;
        return;
    }
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button class="pagination-btn ${i === appState.currentPage ? 'page-active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }
    paginationDiv.innerHTML = html;
}

// ============================================
// FUNCIONES DE GRÁFICOS
// ============================================

function renderCharts() {
    Object.values(appState.charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    renderStatusChart();
    renderSizesChart();
    renderMonthlyChart();
    renderClientsChart();
}

function renderStatusChart() {
    const ctx = document.getElementById('status-chart')?.getContext('2d');
    if (!ctx) return;
    
    const delivered = appState.inventory.filter(i => i.status === 'Entregado').length;
    const refill = appState.inventory.filter(i => i.status === 'Para Relleno').length;
    
    appState.charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entregados', 'Para Relleno'],
            datasets: [{
                data: [delivered, refill],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function renderSizesChart() {
    const ctx = document.getElementById('sizes-chart')?.getContext('2d');
    if (!ctx) return;
    
    const sizes = {};
    appState.inventory.forEach(item => {
        sizes[item.cylinderSize] = (sizes[item.cylinderSize] || 0) + 1;
    });
    
    appState.charts.sizes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(sizes).map(s => `${s} m³`),
            datasets: [{
                label: 'Cantidad de tubos',
                data: Object.values(sizes),
                backgroundColor: '#667eea',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function renderMonthlyChart() {
    const ctx = document.getElementById('monthly-chart')?.getContext('2d');
    if (!ctx) return;
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const deliveredData = new Array(6).fill(0);
    const refillData = new Array(6).fill(0);
    
    const now = new Date();
    appState.inventory.forEach(item => {
        const dateParts = item.datetime.split(',')[0].split('/');
        if (dateParts.length === 3) {
            const itemDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
            const monthDiff = (now.getFullYear() - itemDate.getFullYear()) * 12 + (now.getMonth() - itemDate.getMonth());
            
            if (monthDiff >= 0 && monthDiff < 6) {
                const index = 5 - monthDiff;
                if (item.status === 'Entregado') {
                    deliveredData[index]++;
                } else {
                    refillData[index]++;
                }
            }
        }
    });
    
    appState.charts.monthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Entregados',
                    data: deliveredData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Para Relleno',
                    data: refillData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000
            }
        }
    });
}

function renderClientsChart() {
    const ctx = document.getElementById('clients-chart')?.getContext('2d');
    if (!ctx) return;
    
    const clientCounts = {};
    appState.inventory.forEach(item => {
        clientCounts[item.clientName] = (clientCounts[item.clientName] || 0) + 1;
    });
    
    const topClients = Object.entries(clientCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    appState.charts.clients = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topClients.map(c => c[0]),
            datasets: [{
                label: 'Tubos',
                data: topClients.map(c => c[1]),
                backgroundColor: '#f59e0b',
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// ============================================
// EXPORTACIÓN CSV
// ============================================

function exportToCSV() {
    const filtered = getFilteredInventory();
    
    if (filtered.length === 0) {
        showNotification('No hay datos para exportar', 'error');
        return;
    }
    
    const headers = ['Serie', 'Tamaño (m³)', 'Monto (BOB)', 'Cliente', 'Fecha', 'Estado', 'Propietario'];
    const csvRows = [
        headers.join(','),
        ...filtered.map(item => [
            item.serialNumber,
            item.cylinderSize,
            item.amount || '',
            `"${item.clientName}"`,
            item.datetime,
            item.status,
            item.owner
        ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `oxipur_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    
    showNotification('Archivo exportado correctamente');
    URL.revokeObjectURL(url);
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    if (document.getElementById('cylinder-form')) {
        
        // Agregar loader si no existe
        if (!document.getElementById('loader')) {
            const loader = document.createElement('div');
            loader.id = 'loader';
            loader.className = 'loader';
            loader.innerHTML = '<div class="spinner"></div><p>Cargando datos...</p>';
            document.body.appendChild(loader);
        }
        
        // Cargar datos
        loadFromJSON();
        
        // Actualizar fecha/hora
        updateDateTime();
        setInterval(updateDateTime, 60000);
        
        // Event listeners
        document.getElementById('reset-form').addEventListener('click', () => {
            document.getElementById('cylinder-form').reset();
            updateDateTime();
        });
        
        document.getElementById('cylinder-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newItem = {
                id: Date.now().toString(),
                serialNumber: document.getElementById('serial-number').value,
                cylinderSize: document.getElementById('cylinder-size').value,
                amount: document.getElementById('amount').value || '',
                clientName: document.getElementById('client-name').value,
                datetime: document.getElementById('datetime').value,
                status: document.getElementById('amount').value ? 'Entregado' : 'Para Relleno',
                owner: document.getElementById('owner').value
            };
            
            appState.inventory.unshift(newItem);
            saveToJSON();
            
            document.getElementById('cylinder-form').reset();
            updateDateTime();
            renderInventoryTable();
            renderCharts();
            
            showNotification('Registro guardado correctamente');
        });
        
        document.getElementById('search').addEventListener('input', (e) => {
            appState.filters.search = e.target.value;
            appState.currentPage = 1;
            renderInventoryTable();
        });
        
        document.getElementById('status-filter').addEventListener('change', (e) => {
            appState.filters.status = e.target.value;
            appState.currentPage = 1;
            renderInventoryTable();
        });
        
        document.getElementById('export-csv').addEventListener('click', exportToCSV);
        
        const statsToggle = document.getElementById('stats-toggle');
        if (statsToggle) {
            statsToggle.addEventListener('click', () => {
                document.querySelector('.stats-panel').classList.toggle('collapsed');
            });
        }
        
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.chart-container').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tab.dataset.chart}-chart-container`).classList.add('active');
            });
        });
        
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.pagination-btn');
            if (!btn) return;
            
            const page = btn.dataset.page;
            const filtered = getFilteredInventory();
            const totalPages = Math.ceil(filtered.length / appState.itemsPerPage);
            
            if (page === 'prev') {
                if (appState.currentPage > 1) appState.currentPage--;
            } else if (page === 'next') {
                if (appState.currentPage < totalPages) appState.currentPage++;
            } else {
                appState.currentPage = parseInt(page);
            }
            
            renderInventoryTable();
        });
    }
});

// Agregar estilos dinámicos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRow {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(5px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.3s ease;
    }
    
    .loader.hidden {
        opacity: 0;
        pointer-events: none;
    }
    
    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 10000;
        border-left: 4px solid;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        border-left-color: #10b981;
    }
    
    .notification.success i {
        color: #10b981;
    }
    
    .notification.error {
        border-left-color: #ef4444;
    }
    
    .notification.error i {
        color: #ef4444;
    }
    
    .card-animate {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }
    
    .card-animate.show {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);