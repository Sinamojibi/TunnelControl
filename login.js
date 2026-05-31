// ==================== خواندن از CSV ====================
let validUsers = [];

// خواندن فایل CSV
async function loadUsersFromCSV() {
    try {
        console.log("در حال خواندن فایل users.csv...");
        const response = await fetch('users.csv');
        
        if (!response.ok) {
            throw new Error('فایل users.csv پیدا نشد');
        }
        
        const text = await response.text();
        console.log("محتویات فایل:", text);
        
        // تبدیل CSV به آرایه
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        console.log("سرستون‌ها:", headers);
        
        // پیدا کردن ستون نام کاربری و رمز
        const usernameIndex = headers.findIndex(h => h === 'username');
        const passwordIndex = headers.findIndex(h => h === 'password');
        
        // ستون‌های دسترسی
        const orgIndex = headers.findIndex(h => h === 'org');
        const employeesIndex = headers.findIndex(h => h === 'employees');
        const projectsIndex = headers.findIndex(h => h === 'projects');
        const linksIndex = headers.findIndex(h => h === 'links');
        const projectmanagementIndex = headers.findIndex(h => h === 'projectmanagement');
        
        console.log("ستون نام کاربری:", usernameIndex);
        console.log("ستون رمز:", passwordIndex);
        console.log("ستون org:", orgIndex);
        console.log("ستون employees:", employeesIndex);
        console.log("ستون projects:", projectsIndex);
        console.log("ستون links:", linksIndex);
        console.log("ستون projectmanagement:", projectmanagementIndex);
        
        if (usernameIndex === -1 || passwordIndex === -1) {
            throw new Error('ستون‌های مناسب پیدا نشد');
        }
        
        // خواندن داده‌ها
        validUsers = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values[usernameIndex] && values[passwordIndex]) {
                const userData = {
    username: values[usernameIndex],
    password: values[passwordIndex],
    org: orgIndex !== -1 ? (values[orgIndex] === 'TRUE' || values[orgIndex] === 'true') : true,
    employees: employeesIndex !== -1 ? (values[employeesIndex] === 'TRUE' || values[employeesIndex] === 'true') : true,
    projects: projectsIndex !== -1 ? (values[projectsIndex] === 'TRUE' || values[projectsIndex] === 'true') : true,
    links: linksIndex !== -1 ? (values[linksIndex] === 'TRUE' || values[linksIndex] === 'true') : true,
    projectmanagement: projectmanagementIndex !== -1 ? (values[projectmanagementIndex] === 'TRUE' || values[projectmanagementIndex] === 'true') : true
};
                validUsers.push(userData);
                console.log("کاربر بارگذاری شد:", userData.username, "دسترسی‌ها:", userData.org, userData.employees, userData.projects, userData.links, userData.projectmanagement);
            }
        }
        
        console.log("✅ کاربران بارگذاری شدند:", validUsers);
        return true;
        
    } catch (error) {
        console.error("⚠️ خطا:", error.message);
        // داده پیش‌فرض با دسترسی‌های کامل
        validUsers = [
            { username: "admin", password: "123", org: true, employees: true, projects: true, links: true, projectmanagement: true }
        ];
        return false;
    }
}

// ==================== صفحه لاگین ====================
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('errorMsg');
    const loginBtn = document.querySelector('.login-btn');
    
    // بارگذاری CSV
    loadUsersFromCSV();
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        console.log("تلاش برای ورود:", username);
        
        if (!username || !password) {
            errorMsg.textContent = '❌ لطفا نام کاربری و رمز عبور را وارد کنید!';
            return;
        }
        
        const originalText = loginBtn.innerHTML;
        loginBtn.disabled = true;
        loginBtn.innerHTML = 'در حال بررسی...';
        loginBtn.style.opacity = '0.7';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const foundUser = validUsers.find(user => user.username === username && user.password === password);
        
        console.log("کاربر پیدا شد؟", foundUser);
        
        if (foundUser) {
            console.log("✅ ورود موفق!");
            loginBtn.innerHTML = 'در حال هدایت...';
            
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('username', username);
            
            // ذخیره دسترسی‌ها - اطمینان از مقداردهی صحیح
            const accessData = {
                org: foundUser.org === true,
                employees: foundUser.employees === true,
                projects: foundUser.projects === true,
                links: foundUser.links === true,
                projectmanagement: foundUser.projectmanagement === true
            };
            
            localStorage.setItem('userAccess', JSON.stringify(accessData));
            console.log("دسترسی‌های ذخیره شده:", accessData);
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            console.log("❌ ورود ناموفق");
            errorMsg.textContent = '❌ نام کاربری یا رمز عبور اشتباه است!';
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
            loginBtn.style.opacity = '1';
            
            setTimeout(() => {
                errorMsg.textContent = '';
            }, 3000);
        }
    });
}

// ==================== صفحه داشبورد ====================
if (window.location.pathname.includes('dashboard.html')) {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index.html';
    }

    document.getElementById('userNameDisplay').innerText = localStorage.getItem('username') || 'کاربر';
    
    // دریافت دسترسی‌ها با مقدار پیش‌فرض true
    let userAccess = { org: true, employees: true, projects: true, links: true, projectmanagement: true };
    
    try {
        const storedAccess = localStorage.getItem('userAccess');
        if (storedAccess) {
            userAccess = JSON.parse(storedAccess);
            console.log("دسترسی‌های خوانده شده:", userAccess);
        } else {
            console.log("دسترسی‌ها در localStorage یافت نشد، استفاده از پیش‌فرض (همه فعال)");
        }
    } catch(e) {
        console.error("خطا در خواندن دسترسی‌ها:", e);
    }
    
    // نمایش یا مخفی کردن منوها
    const menuItems = {
        org: document.querySelector('.nav-item[data-section="org"]'),
        employees: document.querySelector('.nav-item[data-section="employees"]'),
        projects: document.querySelector('.nav-item[data-section="projects"]'),
        links: document.querySelector('.nav-item[data-section="links"]'),
        projectmanagement: document.querySelector('.nav-item[data-section="projectmanagement"]')
    };
    
    // همه منوها را ابتدا نمایش بده
    Object.values(menuItems).forEach(item => {
        if (item) item.style.display = 'flex';
    });
    
    // سپس منوهای غیرمجاز را مخفی کن
    if (userAccess.org === false && menuItems.org) menuItems.org.style.display = 'none';
    if (userAccess.employees === false && menuItems.employees) menuItems.employees.style.display = 'none';
    if (userAccess.projects === false && menuItems.projects) menuItems.projects.style.display = 'none';
    if (userAccess.links === false && menuItems.links) menuItems.links.style.display = 'none';
    if (userAccess.projectmanagement === false && menuItems.projectmanagement) menuItems.projectmanagement.style.display = 'none';
    
    console.log("دسترسی‌ها اعمال شد - org:", userAccess.org, "employees:", userAccess.employees, "projects:", userAccess.projects, "links:", userAccess.links, "projectmanagement:", userAccess.projectmanagement);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
}