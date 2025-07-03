-- D365 Test Automation Platform Database Schema
-- SQL Server compatible schema for the test automation platform

-- Enable features if needed
-- SET ANSI_NULLS ON
-- GO
-- SET QUOTED_IDENTIFIER ON
-- GO

-- Create database (uncomment if needed)
-- CREATE DATABASE D365TestPlatform
-- GO
-- USE D365TestPlatform
-- GO

-- =============================================
-- Users Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        email NVARCHAR(100) NOT NULL UNIQUE,
        hashed_password NVARCHAR(255) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2(7) NULL,
        
        -- Indexes
        INDEX IX_users_username (username),
        INDEX IX_users_email (email),
        INDEX IX_users_is_active (is_active)
    );
END
GO

-- =============================================
-- Test Cases Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_cases' AND xtype='U')
BEGIN
    CREATE TABLE test_cases (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        description NTEXT NULL,
        steps NVARCHAR(MAX) NOT NULL, -- JSON array of test steps
        expected_result NVARCHAR(20) NOT NULL DEFAULT 'pass', -- pass/fail
        tags NVARCHAR(500) NULL, -- Comma-separated tags
        is_active BIT NOT NULL DEFAULT 1,
        owner_id INT NOT NULL,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2(7) NULL,
        
        -- Foreign Keys
        CONSTRAINT FK_test_cases_owner 
            FOREIGN KEY (owner_id) REFERENCES users(id)
            ON DELETE CASCADE,
        
        -- Indexes
        INDEX IX_test_cases_owner_id (owner_id),
        INDEX IX_test_cases_is_active (is_active),
        INDEX IX_test_cases_name (name),
        INDEX IX_test_cases_created_at (created_at DESC)
    );
END
GO

-- =============================================
-- Test Runs Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_runs' AND xtype='U')
BEGIN
    CREATE TABLE test_runs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        test_case_id INT NOT NULL,
        user_id INT NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/running/passed/failed/error
        result NTEXT NULL, -- Detailed result output
        execution_time FLOAT NULL, -- Execution time in seconds
        screenshot_path NVARCHAR(500) NULL, -- Path to screenshot if available
        trace_path NVARCHAR(500) NULL, -- Path to Playwright trace
        error_message NTEXT NULL, -- Error details if failed
        started_at DATETIME2(7) NULL,
        completed_at DATETIME2(7) NULL,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign Keys
        CONSTRAINT FK_test_runs_test_case 
            FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
            ON DELETE CASCADE,
        CONSTRAINT FK_test_runs_user 
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE,
        
        -- Check Constraints
        CONSTRAINT CK_test_runs_status 
            CHECK (status IN ('pending', 'running', 'passed', 'failed', 'error')),
        CONSTRAINT CK_test_runs_execution_time 
            CHECK (execution_time IS NULL OR execution_time >= 0),
        
        -- Indexes
        INDEX IX_test_runs_test_case_id (test_case_id),
        INDEX IX_test_runs_user_id (user_id),
        INDEX IX_test_runs_status (status),
        INDEX IX_test_runs_created_at (created_at DESC),
        INDEX IX_test_runs_completed_at (completed_at DESC)
    );
END
GO

-- =============================================
-- Test Suites Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_suites' AND xtype='U')
BEGIN
    CREATE TABLE test_suites (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        description NTEXT NULL,
        test_case_ids NVARCHAR(MAX) NOT NULL, -- JSON array of test case IDs
        owner_id INT NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2(7) NULL,
        
        -- Foreign Keys
        CONSTRAINT FK_test_suites_owner 
            FOREIGN KEY (owner_id) REFERENCES users(id)
            ON DELETE CASCADE,
        
        -- Indexes
        INDEX IX_test_suites_owner_id (owner_id),
        INDEX IX_test_suites_is_active (is_active),
        INDEX IX_test_suites_name (name)
    );
END
GO

-- =============================================
-- Environments Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='environments' AND xtype='U')
BEGIN
    CREATE TABLE environments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        url NVARCHAR(500) NOT NULL,
        description NTEXT NULL,
        owner_id INT NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign Keys
        CONSTRAINT FK_environments_owner 
            FOREIGN KEY (owner_id) REFERENCES users(id)
            ON DELETE CASCADE,
        
        -- Indexes
        INDEX IX_environments_owner_id (owner_id),
        INDEX IX_environments_is_active (is_active),
        INDEX IX_environments_name (name)
    );
END
GO

-- =============================================
-- Test Suite Runs Table (for tracking suite executions)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_suite_runs' AND xtype='U')
BEGIN
    CREATE TABLE test_suite_runs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        test_suite_id INT NOT NULL,
        user_id INT NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/running/completed/failed
        total_tests INT NOT NULL DEFAULT 0,
        passed_tests INT NOT NULL DEFAULT 0,
        failed_tests INT NOT NULL DEFAULT 0,
        started_at DATETIME2(7) NULL,
        completed_at DATETIME2(7) NULL,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign Keys
        CONSTRAINT FK_test_suite_runs_suite 
            FOREIGN KEY (test_suite_id) REFERENCES test_suites(id)
            ON DELETE CASCADE,
        CONSTRAINT FK_test_suite_runs_user 
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE,
        
        -- Check Constraints
        CONSTRAINT CK_test_suite_runs_status 
            CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        CONSTRAINT CK_test_suite_runs_counts 
            CHECK (total_tests >= 0 AND passed_tests >= 0 AND failed_tests >= 0),
        
        -- Indexes
        INDEX IX_test_suite_runs_suite_id (test_suite_id),
        INDEX IX_test_suite_runs_user_id (user_id),
        INDEX IX_test_suite_runs_status (status),
        INDEX IX_test_suite_runs_created_at (created_at DESC)
    );
END
GO

-- =============================================
-- Test Steps Table (for detailed step tracking)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_steps' AND xtype='U')
BEGIN
    CREATE TABLE test_steps (
        id INT IDENTITY(1,1) PRIMARY KEY,
        test_run_id INT NOT NULL,
        step_number INT NOT NULL,
        step_type NVARCHAR(50) NOT NULL, -- navigate, click, fill, verify, wait, etc.
        selector NVARCHAR(500) NULL,
        value NVARCHAR(MAX) NULL,
        expected NVARCHAR(500) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/passed/failed/skipped
        error_message NTEXT NULL,
        execution_time FLOAT NULL,
        screenshot_path NVARCHAR(500) NULL,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign Keys
        CONSTRAINT FK_test_steps_run 
            FOREIGN KEY (test_run_id) REFERENCES test_runs(id)
            ON DELETE CASCADE,
        
        -- Check Constraints
        CONSTRAINT CK_test_steps_status 
            CHECK (status IN ('pending', 'passed', 'failed', 'skipped')),
        CONSTRAINT CK_test_steps_step_number 
            CHECK (step_number > 0),
        CONSTRAINT CK_test_steps_execution_time 
            CHECK (execution_time IS NULL OR execution_time >= 0),
        
        -- Indexes
        INDEX IX_test_steps_run_id (test_run_id),
        INDEX IX_test_steps_step_number (test_run_id, step_number),
        INDEX IX_test_steps_status (status)
    );
END
GO

-- =============================================
-- User Sessions Table (for authentication tracking)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_sessions' AND xtype='U')
BEGIN
    CREATE TABLE user_sessions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        session_token NVARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME2(7) NOT NULL,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        last_activity DATETIME2(7) NULL,
        ip_address NVARCHAR(45) NULL, -- Support IPv6
        user_agent NVARCHAR(500) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        
        -- Foreign Keys
        CONSTRAINT FK_user_sessions_user 
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE,
        
        -- Indexes
        INDEX IX_user_sessions_user_id (user_id),
        INDEX IX_user_sessions_token (session_token),
        INDEX IX_user_sessions_expires_at (expires_at),
        INDEX IX_user_sessions_is_active (is_active)
    );
END
GO

-- =============================================
-- Test Artifacts Table (for storing screenshots, traces, etc.)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_artifacts' AND xtype='U')
BEGIN
    CREATE TABLE test_artifacts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        test_run_id INT NOT NULL,
        artifact_type NVARCHAR(50) NOT NULL, -- screenshot, trace, video, log
        file_path NVARCHAR(500) NOT NULL,
        file_size BIGINT NULL,
        mime_type NVARCHAR(100) NULL,
        description NVARCHAR(255) NULL,
        created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign Keys
        CONSTRAINT FK_test_artifacts_run 
            FOREIGN KEY (test_run_id) REFERENCES test_runs(id)
            ON DELETE CASCADE,
        
        -- Check Constraints
        CONSTRAINT CK_test_artifacts_file_size 
            CHECK (file_size IS NULL OR file_size >= 0),
        
        -- Indexes
        INDEX IX_test_artifacts_run_id (test_run_id),
        INDEX IX_test_artifacts_type (artifact_type),
        INDEX IX_test_artifacts_created_at (created_at DESC)
    );
END
GO

-- =============================================
-- Views for common queries
-- =============================================

-- View for test case statistics
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'vw_test_case_stats')
BEGIN
    EXEC('
    CREATE VIEW vw_test_case_stats AS
    SELECT 
        tc.id,
        tc.name,
        tc.owner_id,
        tc.created_at,
        COUNT(tr.id) as total_runs,
        SUM(CASE WHEN tr.status = ''passed'' THEN 1 ELSE 0 END) as passed_runs,
        SUM(CASE WHEN tr.status = ''failed'' THEN 1 ELSE 0 END) as failed_runs,
        SUM(CASE WHEN tr.status = ''error'' THEN 1 ELSE 0 END) as error_runs,
        AVG(tr.execution_time) as avg_execution_time,
        MAX(tr.created_at) as last_run_at
    FROM test_cases tc
    LEFT JOIN test_runs tr ON tc.id = tr.test_case_id
    WHERE tc.is_active = 1
    GROUP BY tc.id, tc.name, tc.owner_id, tc.created_at
    ')
END
GO

-- View for user dashboard statistics
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'vw_user_dashboard_stats')
BEGIN
    EXEC('
    CREATE VIEW vw_user_dashboard_stats AS
    SELECT 
        u.id as user_id,
        u.username,
        COUNT(DISTINCT tc.id) as total_test_cases,
        COUNT(tr.id) as total_test_runs,
        SUM(CASE WHEN tr.status = ''passed'' THEN 1 ELSE 0 END) as passed_runs,
        SUM(CASE WHEN tr.status = ''failed'' THEN 1 ELSE 0 END) as failed_runs,
        SUM(CASE WHEN tr.status = ''error'' THEN 1 ELSE 0 END) as error_runs,
        AVG(tr.execution_time) as avg_execution_time,
        CASE 
            WHEN COUNT(tr.id) > 0 THEN 
                CAST(SUM(CASE WHEN tr.status = ''passed'' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(tr.id) * 100 
            ELSE 0 
        END as success_rate
    FROM users u
    LEFT JOIN test_cases tc ON u.id = tc.owner_id AND tc.is_active = 1
    LEFT JOIN test_runs tr ON tc.id = tr.test_case_id
    GROUP BY u.id, u.username
    ')
END
GO

-- =============================================
-- Stored Procedures
-- =============================================

-- Procedure to clean up old test artifacts
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_cleanup_old_artifacts')
    DROP PROCEDURE sp_cleanup_old_artifacts
GO

CREATE PROCEDURE sp_cleanup_old_artifacts
    @days_to_keep INT = 90
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @cutoff_date DATETIME2(7) = DATEADD(day, -@days_to_keep, GETUTCDATE());
    
    -- Delete old test artifacts
    DELETE FROM test_artifacts 
    WHERE test_run_id IN (
        SELECT id FROM test_runs 
        WHERE created_at < @cutoff_date
    );
    
    -- Delete old test steps
    DELETE FROM test_steps 
    WHERE test_run_id IN (
        SELECT id FROM test_runs 
        WHERE created_at < @cutoff_date
    );
    
    -- Delete old test runs
    DELETE FROM test_runs 
    WHERE created_at < @cutoff_date;
    
    -- Clean up expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < GETUTCDATE() OR created_at < @cutoff_date;
    
    SELECT 
        @@ROWCOUNT as rows_deleted,
        @cutoff_date as cutoff_date;
END
GO

-- Procedure to get test execution trends
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_get_test_trends')
    DROP PROCEDURE sp_get_test_trends
GO

CREATE PROCEDURE sp_get_test_trends
    @user_id INT,
    @days INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @start_date DATETIME2(7) = DATEADD(day, -@days, GETUTCDATE());
    
    SELECT 
        CAST(created_at AS DATE) as date,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_runs,
        AVG(execution_time) as avg_execution_time,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                CAST(SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 
            ELSE 0 
        END as success_rate
    FROM test_runs 
    WHERE user_id = @user_id 
        AND created_at >= @start_date
        AND status IN ('passed', 'failed', 'error')
    GROUP BY CAST(created_at AS DATE)
    ORDER BY date;
END
GO

-- =============================================
-- Initial Data Setup
-- =============================================

-- Create default admin user (optional)
IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
BEGIN
    INSERT INTO users (username, email, hashed_password, is_active)
    VALUES ('admin', 'admin@d365testplatform.com', '$2b$12$placeholder_hash_for_admin', 1);
END
GO

-- =============================================
-- Security and Permissions
-- =============================================

-- Create application roles (optional)
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'D365TestPlatformUser')
BEGIN
    CREATE ROLE D365TestPlatformUser;
    
    -- Grant necessary permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON users TO D365TestPlatformUser;
    GRANT SELECT, INSERT, UPDATE, DELETE ON test_cases TO D365TestPlatformUser;
    GRANT SELECT, INSERT, UPDATE, DELETE ON test_runs TO D365TestPlatformUser;
    GRANT SELECT, INSERT, UPDATE, DELETE ON test_suites TO D365TestPlatformUser;
    GRANT SELECT, INSERT, UPDATE, DELETE ON environments TO D365TestPlatformUser;
    GRANT SELECT, INSERT, UPDATE, DELETE ON test_suite_runs TO D365TestPlatformUser;
    GRANT SELECT, INSERT, UPDATE, DELETE ON test_steps TO D365TestPlatformUser;
    GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO D365TestPlatformUser;
    GRANT SELECT, INSERT, UPDATE, DELETE ON test_artifacts TO D365TestPlatformUser;
    
    -- Grant view permissions
    GRANT SELECT ON vw_test_case_stats TO D365TestPlatformUser;
    GRANT SELECT ON vw_user_dashboard_stats TO D365TestPlatformUser;
    
    -- Grant execute permissions on procedures
    GRANT EXECUTE ON sp_cleanup_old_artifacts TO D365TestPlatformUser;
    GRANT EXECUTE ON sp_get_test_trends TO D365TestPlatformUser;
END
GO

PRINT 'D365 Test Automation Platform database schema created successfully!';
