-- Cultivation MSSQL şema scripti
-- Bu script, SQLAlchemy modelleri ile uyumlu tablo yapısını oluşturur.

IF DB_ID(N'CultivationDB') IS NULL
BEGIN
    CREATE DATABASE CultivationDB;
END;
GO

USE CultivationDB;
GO

-- USERS
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        full_name      NVARCHAR(100)    NOT NULL,
        email          NVARCHAR(120)    NOT NULL,
        password_hash  NVARCHAR(MAX)    NOT NULL,
        birth_date     DATE             NULL,
        gender         NVARCHAR(20)     NULL,
        weight         DECIMAL(5,2)     NULL,
        height         INT              NULL,
        created_at     DATETIME2        NOT NULL CONSTRAINT df_users_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT uq_users_email UNIQUE (email)
    );
END;
GO

-- DAILY_LOGS
IF OBJECT_ID(N'dbo.daily_logs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.daily_logs (
        id                INT IDENTITY(1,1) PRIMARY KEY,
        user_id           INT           NOT NULL,
        log_date          DATE          NOT NULL,
        notes             NVARCHAR(MAX) NULL,
        study_minutes     INT           NULL,
        calories_burned   INT           NULL,
        water_intake_ml   INT           NULL,
        sleep_hours       DECIMAL(4,2)  NULL,
        productivity_score INT          NULL,
        CONSTRAINT fk_daily_logs_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE,
        CONSTRAINT uq_daily_logs_user_date UNIQUE (user_id, log_date)
    );
END;
GO

-- HABITS
IF OBJECT_ID(N'dbo.habits', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.habits (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        user_id        INT            NOT NULL,
        habit_name     NVARCHAR(150)  NOT NULL,
        frequency      NVARCHAR(30)   NULL,
        target_per_week INT           NULL,
        CONSTRAINT fk_habits_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );
END;
GO

-- HABIT_LOGS
IF OBJECT_ID(N'dbo.habit_logs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.habit_logs (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        habit_id    INT         NOT NULL,
        log_date    DATE        NOT NULL,
        is_completed BIT        NOT NULL CONSTRAINT df_habit_logs_is_completed DEFAULT (0),
        CONSTRAINT fk_habit_logs_habit FOREIGN KEY (habit_id) REFERENCES dbo.habits (id) ON DELETE CASCADE,
        CONSTRAINT uq_habit_logs_habit_date UNIQUE (habit_id, log_date)
    );
END;
GO

-- MOOD_RECORDS
IF OBJECT_ID(N'dbo.mood_records', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.mood_records (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        user_id    INT            NOT NULL,
        mood_tag   NVARCHAR(50)   NULL,
        mood_score INT            NOT NULL,
        record_date DATE          NOT NULL,
        CONSTRAINT fk_mood_records_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );
END;
GO

-- HEALTH_RECORDS
IF OBJECT_ID(N'dbo.health_records', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.health_records (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        user_id     INT            NOT NULL,
        record_type NVARCHAR(50)   NOT NULL,
        start_date  DATE           NULL,
        end_date    DATE           NULL,
        intensity   NVARCHAR(30)   NULL,
        notes       NVARCHAR(MAX)  NULL,
        CONSTRAINT fk_health_records_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );
END;
GO

-- USER_STATS
IF OBJECT_ID(N'dbo.user_stats', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_stats (
        user_id       INT PRIMARY KEY,
        total_points  INT NOT NULL CONSTRAINT df_user_stats_total_points DEFAULT (0),
        current_level INT NOT NULL CONSTRAINT df_user_stats_current_level DEFAULT (1),
        streak_count  INT NOT NULL CONSTRAINT df_user_stats_streak_count DEFAULT (0),
        CONSTRAINT fk_user_stats_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );
END;
GO

