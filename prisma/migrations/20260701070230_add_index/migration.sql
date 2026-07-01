-- CreateIndex
CREATE INDEX "BOOKINGS_Customer_ID_idx" ON "BOOKINGS"("Customer_ID");

-- CreateIndex
CREATE INDEX "BOOKINGS_Invoice_ID_idx" ON "BOOKINGS"("Invoice_ID");

-- CreateIndex
CREATE INDEX "BOOKINGS_Arrival_Time_idx" ON "BOOKINGS"("Arrival_Time");

-- CreateIndex
CREATE INDEX "BOOKING_DETAILS_Booking_ID_idx" ON "BOOKING_DETAILS"("Booking_ID");

-- CreateIndex
CREATE INDEX "BOOKING_DETAILS_Service_ID_idx" ON "BOOKING_DETAILS"("Service_ID");

-- CreateIndex
CREATE INDEX "BOOKING_DETAILS_Cust_Pkg_ID_idx" ON "BOOKING_DETAILS"("Cust_Pkg_ID");

-- CreateIndex
CREATE INDEX "BOOKING_EMPLOYEES_Booking_Detail_ID_idx" ON "BOOKING_EMPLOYEES"("Booking_Detail_ID");

-- CreateIndex
CREATE INDEX "BOOKING_EMPLOYEES_Employee_ID_idx" ON "BOOKING_EMPLOYEES"("Employee_ID");

-- CreateIndex
CREATE INDEX "CUSTOMER_PACKAGES_Customer_ID_idx" ON "CUSTOMER_PACKAGES"("Customer_ID");

-- CreateIndex
CREATE INDEX "CUSTOMER_PACKAGES_Package_ID_idx" ON "CUSTOMER_PACKAGES"("Package_ID");

-- CreateIndex
CREATE INDEX "CUSTOMER_PROGRESS_Booking_Detail_ID_idx" ON "CUSTOMER_PROGRESS"("Booking_Detail_ID");

-- CreateIndex
CREATE INDEX "EMPLOYEE_SCHEDULES_Employee_ID_idx" ON "EMPLOYEE_SCHEDULES"("Employee_ID");

-- CreateIndex
CREATE INDEX "EMPLOYEE_SCHEDULES_Work_Date_idx" ON "EMPLOYEE_SCHEDULES"("Work_Date");

-- CreateIndex
CREATE INDEX "EMPLOYEE_SKILLS_Employee_ID_idx" ON "EMPLOYEE_SKILLS"("Employee_ID");

-- CreateIndex
CREATE INDEX "EMPLOYEE_SKILLS_Service_ID_idx" ON "EMPLOYEE_SKILLS"("Service_ID");

-- CreateIndex
CREATE INDEX "INVOICES_Customer_ID_idx" ON "INVOICES"("Customer_ID");

-- CreateIndex
CREATE INDEX "INVOICES_Created_At_idx" ON "INVOICES"("Created_At");

-- CreateIndex
CREATE INDEX "ORDERS_Customer_ID_idx" ON "ORDERS"("Customer_ID");

-- CreateIndex
CREATE INDEX "ORDERS_Invoice_ID_idx" ON "ORDERS"("Invoice_ID");

-- CreateIndex
CREATE INDEX "ORDER_DETAILS_Order_ID_idx" ON "ORDER_DETAILS"("Order_ID");

-- CreateIndex
CREATE INDEX "ORDER_DETAILS_Product_ID_idx" ON "ORDER_DETAILS"("Product_ID");

-- CreateIndex
CREATE INDEX "ORDER_DETAILS_Employee_ID_idx" ON "ORDER_DETAILS"("Employee_ID");

-- CreateIndex
CREATE INDEX "USERS_Role_ID_idx" ON "USERS"("Role_ID");
