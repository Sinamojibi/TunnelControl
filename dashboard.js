let employeesList = [];
let orgUnitsList = [];
let documentsList = [];
let linksList = [];
let currentOrgUnit = null;

// ==================== تابع خواندن CSV با روش تضمینی فارسی ====================
async function loadCSV(filename) {
    try {
        console.log(`📁 خواندن: ${filename}`);
        
        // استفاده از fetch با charset=UTF-8
        const response = await fetch(filename, {
            headers: {
                'Accept': 'text/csv; charset=utf-8'
            }
        });
        
        if (!response.ok) {
            console.error(`❌ فایل ${filename} پیدا نشد`);
            return null;
        }
        
        // خواندن به صورت text با utf-8
        const text = await response.text();
        
        // حذف BOM اگر وجود داشته باشد
        let cleanText = text;
        if (cleanText.charCodeAt(0) === 0xFEFF) {
            cleanText = cleanText.substring(1);
        }
        
        // حذف کاراکترهای اضافی
        cleanText = cleanText.replace(/\r/g, '');
        
        console.log(`📄 محتوای ${filename}:`);
        console.log(cleanText.substring(0, 300));
        
        // جداسازی خطوط
        const lines = cleanText.trim().split('\n');
        if (lines.length < 2) {
            console.error(`❌ فایل ${filename} خالی است`);
            return null;
        }
        
        // خواندن هدرها
        const headers = lines[0].split(',').map(h => h.trim());
        console.log(`📋 هدرها:`, headers);
        
        // خواندن داده‌ها
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // تقسیم خط به مقادیر (حفظ فارسی)
            const values = [];
            let inQuote = false;
            let currentValue = '';
            
            for (let char of lines[i]) {
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());
            
            // حذف نقل قول‌های اضافی
            const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));
            
            const row = {};
            headers.forEach((header, index) => {
                row[header] = cleanValues[index] || '';
            });
            data.push(row);
        }
        
        console.log(`✅ ${filename}: ${data.length} ردیف`);
        if (data.length > 0) {
            console.log(`نمونه:`, data[0]);
        }
        
        return data;
        
    } catch (error) {
        console.error(`❌ خطا در ${filename}:`, error);
        return null;
    }
}

// ==================== بارگذاری همه داده‌ها ====================
async function loadAllData() {
    console.log("🔄 بارگذاری داده‌ها...");
    
    const employees = await loadCSV('employees.csv');
    const orgUnits = await loadCSV('org_units.csv');
    const documents = await loadCSV('documents.csv');
    const links = await loadCSV('links.csv');
    
    if (employees && employees.length > 0) {
        employeesList = employees;
    } else {
        employeesList = [
            { firstName: "علی", lastName: "رضایی", position: "مدیر مالی", internalPhone: "101" },
            { firstName: "سارا", lastName: "کریمی", position: "کارشناس منابع انسانی", internalPhone: "102" }
        ];
    }
    
    if (orgUnits && orgUnits.length > 0) {
        orgUnitsList = orgUnits;
    } else {
        orgUnitsList = [
            { id: "1", name: "واحد مالی" },
            { id: "2", name: "واحد منابع انسانی" }
        ];
    }
    
    if (documents && documents.length > 0) {
        documentsList = documents;
    } else {
        documentsList = [
            { unit_id: "1", type: "form", name: "فرم درخواست هزینه", file: "#" }
        ];
    }
    
    if (links && links.length > 0) {
        linksList = links;
    } else {
        linksList = [
            { title: "سایت سازمان", url: "https://www.google.com", icon: "🌐" }
        ];
    }
    
    console.log("🎯 بارگذاری کامل شد!");
}

// ==================== نمایش واحدهای سازمانی ====================
function displayOrgUnits() {
    const container = document.getElementById('orgUnits');
    if (!container) return;
    
    container.innerHTML = '';
    orgUnitsList.forEach(unit => {
        container.innerHTML += `
            <div class="org-card" data-id="${unit.id}">
                <h3>🏢 ${unit.name}</h3>
                <p>برای مشاهده فرم‌ها و دستورالعمل‌ها کلیک کنید</p>
            </div>
        `;
    });
    
    document.querySelectorAll('.org-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            currentOrgUnit = id;
            document.querySelectorAll('.org-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            showSubSections(id);
        });
    });
}

// ==================== نمایش زیربخش‌ها ====================
function showSubSections(unitId) {
    const container = document.getElementById('subSectionsContainer');
    if (!container) return;
    
    const unitDocs = documentsList.filter(doc => String(doc.unit_id) === String(unitId));
    const forms = unitDocs.filter(doc => doc.type === 'form');
    const instructions = unitDocs.filter(doc => doc.type === 'instruction');
    
    if (forms.length === 0 && instructions.length === 0) {
        container.innerHTML = '<div class="sub-sections"><div style="text-align:center; padding:40px;">📂 هیچ مدرکی برای این واحد یافت نشد</div></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="sub-sections">
            <div class="sub-card">
                <h4>📄 فرم‌ها</h4>
                <div class="items-list" id="formsList"></div>
            </div>
            <div class="sub-card">
                <h4>📖 دستورالعمل‌ها</h4>
                <div class="items-list" id="instructionsList"></div>
            </div>
        </div>
    `;
    
    const formsList = document.getElementById('formsList');
    formsList.innerHTML = '';
    forms.forEach(form => {
        formsList.innerHTML += `<a href="${form.file}" target="_blank" class="item-link"><span>📄 ${form.name}</span><span>🔗</span></a>`;
    });
    
    const instructionsList = document.getElementById('instructionsList');
    instructionsList.innerHTML = '';
    instructions.forEach(inst => {
        instructionsList.innerHTML += `<a href="${inst.file}" target="_blank" class="item-link"><span>📖 ${inst.name}</span><span>🔗</span></a>`;
    });
}

// ==================== نمایش کارکنان ====================
function renderEmployees(list) {
    const tbody = document.getElementById('employeesList');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">هیچ نتیجه‌ای یافت نشد</td</tr>';
        return;
    }
    
    list.forEach(emp => {
        tbody.innerHTML += `
            <tr>
                <td>${emp.firstName || '-'}</td>
                <td>${emp.lastName || '-'}</td>
                <td>${emp.position || '-'}</td>
                <td style="direction:ltr;text-align:center;color:#fbbf24;font-weight:bold;">${emp.internalPhone || '-'}</td>
            </tr>
        `;
    });
}

// ==================== نمایش لینک‌ها ====================
function displayLinks() {
    const container = document.getElementById('quickLinks');
    if (!container) return;
    
    container.innerHTML = '';
    linksList.forEach(link => {
        container.innerHTML += `
            <a href="${link.url}" target="_blank" class="quick-link-card">
                <span>${link.icon || '🔗'}</span>
                <h4>${link.title}</h4>
            </a>
        `;
    });
}

// ==================== جستجو ====================
function setupSearch() {
    const searchInput = document.getElementById('searchEmployee');
    if (!searchInput) return;
    
    searchInput.addEventListener('keyup', function() {
        const term = this.value.toLowerCase().trim();
        const filtered = employeesList.filter(emp => 
            (emp.firstName && emp.firstName.toLowerCase().includes(term)) ||
            (emp.lastName && emp.lastName.toLowerCase().includes(term)) ||
            (emp.position && emp.position.toLowerCase().includes(term)) ||
            (emp.internalPhone && emp.internalPhone.includes(term))
        );
        renderEmployees(filtered);
    });
}

// ==================== راه‌اندازی ====================
if (window.location.pathname.includes('dashboard.html')) {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
    
    document.getElementById('userNameDisplay').innerText = localStorage.getItem('username') || 'کاربر';
    
    (async function init() {
        await loadAllData();
        displayOrgUnits();
        renderEmployees(employeesList);
        displayLinks();
        setupSearch();
    })();
    
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
        org: document.getElementById('orgSection'),
        employees: document.getElementById('employeesSection'),
        links: document.getElementById('linksSection')
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            Object.values(sections).forEach(s => s?.classList.remove('active'));
            sections[this.getAttribute('data-section')]?.classList.add('active');
        });
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
    
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });
}