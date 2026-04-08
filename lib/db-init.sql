-- สร้าง database
CREATE DATABASE IF NOT EXISTS company_property;
USE company_property;

-- สร้างตารางแผนก
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตารางทรัพย์สิน
CREATE TABLE IF NOT EXISTS assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  purchase_cost DECIMAL(15, 2) NOT NULL,
  department_id INT NOT NULL,
  caretaker VARCHAR(100) NOT NULL,
  usage_type ENUM('LIVE', 'PRODUCTION', 'OTHER') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- เพิ่มข้อมูลแผนกตัวอย่าง
INSERT INTO departments (name) VALUES 
('แผนก IT'),
('แผนกบัญชี'),
('แผนกขาย'),
('แผนกการตลาด'),
('แผนกบุคคล');
