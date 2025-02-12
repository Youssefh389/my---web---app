document.addEventListener("DOMContentLoaded", function() {

  /***********************

   * إزالة السجلات القديمة *

   ***********************/

  function removeOldRecords() {

    const cutoff = new Date();

    cutoff.setMonth(cutoff.getMonth() - 6);

    

    // إزالة سجلات المبيعات الأقدم من cutoff

    let salesData = JSON.parse(localStorage.getItem("salesData")) || [];

    salesData = salesData.filter(record => new Date(record.date) >= cutoff);

    localStorage.setItem("salesData", JSON.stringify(salesData));

    

    // إزالة سجلات المصروفات الأقدم

    let expensesData = JSON.parse(localStorage.getItem("expensesData")) || [];

    expensesData = expensesData.filter(record => new Date(record.date) >= cutoff);

    localStorage.setItem("expensesData", JSON.stringify(expensesData));

  }

  removeOldRecords();

  /*********************************

   * دوال مساعدة للتعامل مع الشهور *

   *********************************/

  // الحصول على آخر 6 أشهر بصيغة "YYYY-MM"

  function getLastSixMonths() {

    let months = [];

    let now = new Date();

    for (let i = 0; i < 6; i++) {

      let d = new Date(now.getFullYear(), now.getMonth() - i, 1);

      let monthStr = d.getFullYear() + "-" + (d.getMonth() + 1).toString().padStart(2, "0");

      months.push(monthStr);

    }

    return months;

  }

  /*********************************

   * التنقل بين الصفحات عبر القائمة *

   *********************************/

  const menuItems = document.querySelectorAll(".menu li");

  const pages = document.querySelectorAll(".page");

  const contentArea = document.querySelector(".content");

  // إخفاء كافة الصفحات

  function hideAllPages() {

    pages.forEach(page => page.classList.remove("active"));

  }

  // عند النقر على عنصر من القائمة

  menuItems.forEach(item => {

    item.addEventListener("click", function() {

      // إزالة الكلاس active من كافة عناصر القائمة

      menuItems.forEach(i => i.classList.remove("active"));

      this.classList.add("active");

      const targetId = this.getAttribute("data-page");

      hideAllPages();

      const targetPage = document.getElementById(targetId);

      if (targetPage) {

        targetPage.classList.add("active");

        // تغيير خلفية منطقة المحتوى لتكون نفس خلفية رأس الصفحة (يمكن تعديلها حسب الحاجة)

        let headerElem = targetPage.querySelector(".page-header");

        if (headerElem) {

          // هنا نستخدم خلفية رأس الصفحة (تدرج لوني) كخلفية للمحتوى

          // إذا كانت الخلفية عبارة عن صورة أو قيمة أخرى يمكن تعديل هذا الجزء

          contentArea.style.backgroundColor = window.getComputedStyle(headerElem).backgroundColor;

        }

      }

    });

  });

  // تعيين الصفحة الافتراضية (الحساب)

  document.querySelector('.menu li[data-page="page-calculation"]').click();

  /***************************

   * وظائف النماذج والحسابات *

   ***************************/

  const today = new Date().toISOString().split("T")[0];

  const calcDate = document.getElementById("calc-date");

  if (calcDate) calcDate.value = today;

  const expenseDate = document.getElementById("expense-date");

  if (expenseDate) expenseDate.value = today;

  // حساب الإجمالي في نموذج الحساب

  const calcQuantity = document.getElementById("calc-quantity");

  const calcPrice = document.getElementById("calc-price");

  const calcTotal = document.getElementById("calc-total");

  function calculateTotal() {

    const quantity = parseFloat(calcQuantity.value) || 0;

    const price = parseFloat(calcPrice.value) || 0;

    calcTotal.value = (quantity * price).toFixed(2);

  }

  if (calcQuantity) calcQuantity.addEventListener("input", calculateTotal);

  if (calcPrice) calcPrice.addEventListener("input", calculateTotal);

  // حفظ عملية البيع (مع التحقق من اختيار الصنف)

  document.getElementById("calculationForm")?.addEventListener("submit", function(e) {

    e.preventDefault();

    const selectedItem = document.getElementById("calc-item").value;

    if (!selectedItem) {

      alert("الرجاء اختيار الصنف من القائمة.");

      return;

    }

    const date = document.getElementById("calc-date").value;

    const item = selectedItem;

    const quantity = parseFloat(document.getElementById("calc-quantity").value);

    const price = parseFloat(document.getElementById("calc-price").value);

    const total = parseFloat(document.getElementById("calc-total").value);

    const sale = { id: Date.now(), date, item, quantity, price, total };

    let salesData = JSON.parse(localStorage.getItem("salesData")) || [];

    salesData.push(sale);

    localStorage.setItem("salesData", JSON.stringify(salesData));

    // تحديث بيانات الصنف (زيادة الكمية المباعَة وحساب المتبقي)

    updateItemSale(item, quantity);

    this.reset();

    if (calcDate) calcDate.value = today;

    calculateTotal();

    alert("تم حفظ العملية.");

    populateSalesTable();

    populatePreviousMonthsSales();

    populateNetSalesTable();

  });

  // حفظ بيانات المصروفات

  document.getElementById("expenseForm")?.addEventListener("submit", function(e) {

    e.preventDefault();

    const date = document.getElementById("expense-date").value;

    const amount = parseFloat(document.getElementById("expense-amount").value);

    const reason = document.getElementById("expense-reason").value;

    const expense = { id: Date.now(), date, amount, reason };

    let expensesData = JSON.parse(localStorage.getItem("expensesData")) || [];

    expensesData.push(expense);

    localStorage.setItem("expensesData", JSON.stringify(expensesData));

    this.reset();

    if (expenseDate) expenseDate.value = today;

    alert("تم حفظ المصروف.");

    populateExpensesTable();

    populatePreviousMonthsExpenses();

    populateNetSalesTable();

  });

  // حفظ بيانات الأصناف

  document.getElementById("itemForm")?.addEventListener("submit", function(e) {

    e.preventDefault();

    const name = document.getElementById("item-name").value;

    const quantity = parseFloat(document.getElementById("item-quantity").value);

    const price = parseFloat(document.getElementById("item-price").value);

    const itemObj = { id: Date.now(), name, purchased: quantity, price, sold: 0, remaining: quantity };

    let itemsData = JSON.parse(localStorage.getItem("itemsData")) || [];

    if (itemsData.find(it => it.name === name)) {

      alert("الصنف موجود بالفعل.");

      return;

    }

    itemsData.push(itemObj);

    localStorage.setItem("itemsData", JSON.stringify(itemsData));

    this.reset();

    populateItemsTable();

    populateItemsDropdown();

    alert("تم حفظ الصنف.");

  });

  // تحديث بيانات الصنف عند البيع

  function updateItemSale(itemName, soldQuantity) {

    let itemsData = JSON.parse(localStorage.getItem("itemsData")) || [];

    let item = itemsData.find(it => it.name === itemName);

    if (item) {

      item.sold += soldQuantity;

      item.remaining = item.purchased - item.sold;

      localStorage.setItem("itemsData", JSON.stringify(itemsData));

    }

  }

  // تعبئة قائمة الأصناف في نموذج الحساب

  function populateItemsDropdown() {

    const dropdown = document.getElementById("calc-item");

    dropdown.innerHTML = '<option value="">اختر الصنف</option>';

    let itemsData = JSON.parse(localStorage.getItem("itemsData")) || [];

    itemsData.forEach(item => {

      const option = document.createElement("option");

      option.value = item.name;

      option.textContent = item.name;

      dropdown.appendChild(option);

    });

  }

  populateItemsDropdown();

  // تعبئة جدول المبيعات الرئيسي

  function populateSalesTable() {

    const tbody = document.querySelector("#salesTable tbody");

    tbody.innerHTML = "";

    let salesData = JSON.parse(localStorage.getItem("salesData")) || [];

    salesData.forEach(sale => {

      let tr = document.createElement("tr");

      tr.innerHTML = `

        <td>${sale.date}</td>

        <td>${sale.item}</td>

        <td>${sale.quantity}</td>

        <td>${sale.price.toFixed(2)}</td>

        <td>${sale.total.toFixed(2)}</td>

        <td><button class="deleteSale btn" data-id="${sale.id}">حذف</button></td>

      `;

      tbody.appendChild(tr);

    });

    // إضافة أحداث زر الحذف

    document.querySelectorAll(".deleteSale").forEach(btn => {

      btn.addEventListener("click", function() {

        const id = this.getAttribute("data-id");

        deleteSale(id);

      });

    });

  }

  function deleteSale(id) {

    let salesData = JSON.parse(localStorage.getItem("salesData")) || [];

    salesData = salesData.filter(sale => sale.id != id);

    localStorage.setItem("salesData", JSON.stringify(salesData));

    populateSalesTable();

    populatePreviousMonthsSales();

    populateNetSalesTable();

    alert("تم حذف العملية.");

  }

  // تعبئة جدول المصروفات الرئيسي

  function populateExpensesTable() {

    const tbody = document.querySelector("#expensesTable tbody");

    tbody.innerHTML = "";

    let expensesData = JSON.parse(localStorage.getItem("expensesData")) || [];

    expensesData.forEach(expense => {

      let tr = document.createElement("tr");

      tr.innerHTML = `

        <td>${expense.date}</td>

        <td>${expense.amount.toFixed(2)}</td>

        <td>${expense.reason}</td>

        <td><button class="deleteExpense btn" data-id="${expense.id}">حذف</button></td>

      `;

      tbody.appendChild(tr);

    });

    document.querySelectorAll(".deleteExpense").forEach(btn => {

      btn.addEventListener("click", function() {

        const id = this.getAttribute("data-id");

        deleteExpense(id);

      });

    });

  }

  function deleteExpense(id) {

    let expensesData = JSON.parse(localStorage.getItem("expensesData")) || [];

    expensesData = expensesData.filter(expense => expense.id != id);

    localStorage.setItem("expensesData", JSON.stringify(expensesData));

    populateExpensesTable();

    populatePreviousMonthsExpenses();

    populateNetSalesTable();

    alert("تم حذف المصروف.");

  }

  // تعبئة جدول الأصناف الرئيسي

  function populateItemsTable() {

    const tbody = document.querySelector("#itemsTable tbody");

    tbody.innerHTML = "";

    let itemsData = JSON.parse(localStorage.getItem("itemsData")) || [];

    itemsData.forEach(item => {

      let tr = document.createElement("tr");

      tr.innerHTML = `

        <td>${item.name}</td>

        <td>${item.purchased}</td>

        <td>${item.price.toFixed(2)}</td>

        <td>${item.sold}</td>

        <td>${item.remaining}</td>

        <td><button class="deleteItem btn" data-id="${item.id}">حذف</button></td>

      `;

      tbody.appendChild(tr);

    });

    document.querySelectorAll(".deleteItem").forEach(btn => {

      btn.addEventListener("click", function() {

        const id = this.getAttribute("data-id");

        deleteItem(id);

      });

    });

  }

  function deleteItem(id) {

    let itemsData = JSON.parse(localStorage.getItem("itemsData")) || [];

    itemsData = itemsData.filter(item => item.id != id);

    localStorage.setItem("itemsData", JSON.stringify(itemsData));

    populateItemsTable();

    populateItemsDropdown();

    alert("تم حذف الصنف.");

  }

  /**********************************

   * عرض الشهور السابقة للمبيعات *

   **********************************/

  function populatePreviousMonthsSales() {

    const container = document.getElementById("previousMonthsSales");

    container.innerHTML = "";

    let months = getLastSixMonths();

    months.forEach(m => {

      let btn = document.createElement("button");

      btn.textContent = m;

      btn.classList.add("month-btn");

      btn.addEventListener("click", function() {

        populateSalesMonthDetails(m);

      });

      container.appendChild(btn);

    });

  }

  function populateSalesMonthDetails(monthStr) {

    let salesData = JSON.parse(localStorage.getItem("salesData")) || [];

    let filtered = salesData.filter(record => record.date.startsWith(monthStr));

    let tableBody = document.querySelector("#salesMonthTable tbody");

    tableBody.innerHTML = "";

    filtered.forEach(record => {

      let tr = document.createElement("tr");

      tr.innerHTML = `<td>${record.date}</td><td>${record.item}</td><td>${record.quantity}</td><td>${record.price.toFixed(2)}</td><td>${record.total.toFixed(2)}</td>`;

      tableBody.appendChild(tr);

    });

    document.getElementById("salesMonthLabel").textContent = monthStr;

    document.getElementById("salesMonthDetails").style.display = "block";

  }

  /****************************************

   * عرض الشهور السابقة للمصروفات *

   ****************************************/

  function populatePreviousMonthsExpenses() {

    const container = document.getElementById("previousMonthsExpenses");

    container.innerHTML = "";

    let months = getLastSixMonths();

    months.forEach(m => {

      let btn = document.createElement("button");

      btn.textContent = m;

      btn.classList.add("month-btn");

      btn.addEventListener("click", function() {

        populateExpensesMonthDetails(m);

      });

      container.appendChild(btn);

    });

  }

  function populateExpensesMonthDetails(monthStr) {

    let expensesData = JSON.parse(localStorage.getItem("expensesData")) || [];

    let filtered = expensesData.filter(record => record.date.startsWith(monthStr));

    let tableBody = document.querySelector("#expensesMonthTable tbody");

    tableBody.innerHTML = "";

    filtered.forEach(record => {

      let tr = document.createElement("tr");

      tr.innerHTML = `<td>${record.date}</td><td>${record.amount.toFixed(2)}</td><td>${record.reason}</td>`;

      tableBody.appendChild(tr);

    });

    document.getElementById("expensesMonthLabel").textContent = monthStr;

    document.getElementById("expensesMonthDetails").style.display = "block";

  }

  /****************************************

   * عرض الشهور السابقة لصافي المبيعات *

   ****************************************/

  function populatePreviousMonthsNetSales() {

    const container = document.getElementById("previousMonthsNetSales");

    container.innerHTML = "";

    let months = getLastSixMonths();

    months.forEach(m => {

      let btn = document.createElement("button");

      btn.textContent = m;

      btn.classList.add("month-btn");

      btn.addEventListener("click", function() {

        populateNetSalesMonthDetails(m);

      });

      container.appendChild(btn);

    });

  }

  function populateNetSalesMonthDetails(monthStr) {

    let salesData = JSON.parse(localStorage.getItem("salesData")) || [];

    let expensesData = JSON.parse(localStorage.getItem("expensesData")) || [];

    let filteredSales = salesData.filter(record => record.date.startsWith(monthStr));

    let filteredExpenses = expensesData.filter(record => record.date.startsWith(monthStr));

    let totalSales = filteredSales.reduce((sum, r) => sum + r.total, 0);

    let totalExpenses = filteredExpenses.reduce((sum, r) => sum + r.amount, 0);

    let netSales = totalSales - totalExpenses;

    let tableBody = document.querySelector("#netSalesMonthTable tbody");

    tableBody.innerHTML = "";

    let tr = document.createElement("tr");

    tr.innerHTML = `<td>${monthStr}</td><td>${totalSales.toFixed(2)}</td><td>${totalExpenses.toFixed(2)}</td><td>${netSales.toFixed(2)}</td>`;

    tableBody.appendChild(tr);

    document.getElementById("netSalesMonthLabel").textContent = monthStr;

    document.getElementById("netSalesMonthDetails").style.display = "block";

  }

  // تحديث جدول صافي المبيعات الرئيسي

  function populateNetSalesTable() {

    const tbody = document.querySelector("#netSalesTable tbody");

    tbody.innerHTML = "";

    let salesData = JSON.parse(localStorage.getItem("salesData")) || [];

    let expensesData = JSON.parse(localStorage.getItem("expensesData")) || [];

    salesData.forEach(sale => {

      let tr = document.createElement("tr");

      // نعرض هنا السجل المفرد (يمكنك تعديل العرض حسب الحاجة)

      tr.innerHTML = `<td>${sale.date}</td><td>${sale.total.toFixed(2)}</td><td> - </td><td> - </td>`;

      tbody.appendChild(tr);

    });

    // يمكنك حساب الإجماليات الرئيسية وعرضها في القسم المناسب

  }

  // عند تحميل الصفحة، تعبئة الجداول والأزرار

  populateSalesTable();

  populateExpensesTable();

  populateItemsTable();

  populatePreviousMonthsSales();

  populatePreviousMonthsExpenses();

  populatePreviousMonthsNetSales();

  populateNetSalesTable();

  /**********************************************

   * التعديل المطلوب: تفعيل أزرار إضافة المصروف والأصناف *

   **********************************************/

  // تفعيل زر "إضافة مصروف" لتبديل عرض نموذج المصروفات

  const addExpenseBtn = document.getElementById("addExpenseBtn");

  const expenseFormContainer = document.getElementById("expenseFormContainer");

  if (addExpenseBtn && expenseFormContainer) {

    addExpenseBtn.addEventListener("click", function() {

      expenseFormContainer.style.display = (expenseFormContainer.style.display === "none" || expenseFormContainer.style.display === "") ? "block" : "none";

    });

  }

  // تفعيل زر "إضافة صنف" لتبديل عرض نموذج الأصناف

  const addItemBtn = document.getElementById("addItemBtn");

  const itemFormContainer = document.getElementById("itemFormContainer");

  if (addItemBtn && itemFormContainer) {

    addItemBtn.addEventListener("click", function() {

      itemFormContainer.style.display = (itemFormContainer.style.display === "none" || itemFormContainer.style.display === "") ? "block" : "none";

    });

  }

});

