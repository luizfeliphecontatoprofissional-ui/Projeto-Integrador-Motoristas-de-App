
-- ==========================================
-- DRIVEWISE - BANCO DE DADOS MYSQL
-- ==========================================


-- ==========================================
-- 1. CRIAÇÃO DO BANCO DE DADOS
-- ==========================================

CREATE DATABASE IF NOT EXISTS drivewise
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE drivewise;


-- ==========================================
-- 2. TABELA DE VEÍCULOS
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicles (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    ownership ENUM(
        'proprio',
        'alugado'
    ) NOT NULL,

    weekly_rent DECIMAL(10,2)
        NOT NULL DEFAULT 0,

    fuel_type VARCHAR(40) NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- 3. TABELA DE LANÇAMENTOS FINANCEIROS
-- ==========================================

CREATE TABLE IF NOT EXISTS entries (

    id INT AUTO_INCREMENT PRIMARY KEY,

    entry_date DATE NOT NULL,

    kind ENUM(
        'ganho',
        'combustivel',
        'aluguel',
        'manutencao',
        'multa',
        'outros'
    ) NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    kilometers DECIMAL(10,2)
        NOT NULL DEFAULT 0,

    hours_worked DECIMAL(6,2)
        NOT NULL DEFAULT 0,

    description VARCHAR(255),

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_entry_date (entry_date)

);


-- ==========================================
-- 4. TABELA DE CONFIGURAÇÕES
-- ==========================================

CREATE TABLE IF NOT EXISTS settings (

    id TINYINT PRIMARY KEY,

    daily_goal DECIMAL(10,2)
        NOT NULL DEFAULT 200,

    minimum_per_km DECIMAL(10,2)
        NOT NULL DEFAULT 1.50

);


-- ==========================================
-- 5. CONFIGURAÇÕES INICIAIS
-- ==========================================

INSERT IGNORE INTO settings (
    id,
    daily_goal,
    minimum_per_km
)
VALUES (
    1,
    200,
    1.50
);
